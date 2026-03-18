import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, create_model
from typing import List, Optional, Dict, Any
from dependency import get_embedding_model, get_llm, get_rag_collection, get_db_session
import io
from fastapi.responses import StreamingResponse
import pandas as pd
import os
import shutil
import pdfplumber
from uuid import uuid4
from model import Chat, Message, Folder
from sqlmodel import Session, select

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# --- SCHEMAS ---
class UserQuery(BaseModel):
    text: str
    chat_id: int
    # chat_id: str
    columns: List[str]


class TestCaseResponse(BaseModel):
    id: str
    scenario: str
    prerequisites: List[str]
    steps: List[str]
    data: List[str]
    expected: List[str]
    actual: Optional[str] = None
    status: Optional[str] = None


class ExportRequest(BaseModel):
    test_cases: List[TestCaseResponse]


class ChatMove(BaseModel):
    folder_id: Optional[int] = None


class ChatCreate(BaseModel):
    name: str
    user_id: int


class ChatRename(BaseModel):
    name: str


# --- HELPER: CONSTRUCT PROMPT ---
def build_dynamic_json_schema(columns: List[str]) -> dict:
    """Dynamically creates a Pydantic model and returns its JSON schema."""
    fields = {}

    list_columns = ["prerequisites", "steps", "data", "expected"]

    for col in columns:
        if col in list_columns:
            fields[col] = (List[str], ...)  # Required List of strings
        else:
            fields[col] = (str, ...)  # Required String

    # Create the Pydantic model in memory
    DynamicTestCase = create_model("DynamicTestCase", **fields)

    # Return the JSON schema dictionary (use .schema() for Pydantic v1, .model_json_schema() for v2)
    return DynamicTestCase.model_json_schema()


def extract_use_cases(pdf_path):
    """Your existing semantic parsing logic goes here."""
    all_rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                cleaned_rows = [row for row in table if any(row)]
                all_rows.extend(cleaned_rows)

    use_cases = []
    current_buffer = []
    for row in all_rows:
        if len(row) < 2:
            continue
        field = row[0].strip() if row[0] else ""
        value = row[1].strip() if row[1] else ""

        if "Use Case Name" in field or "Use Case ID" in field:
            if "Use Case Name" in field and current_buffer:
                use_cases.append("\n".join(current_buffer))
                current_buffer = []

        if field:
            current_buffer.append(f"\n### {field}:")
        if value:
            current_buffer.append(value)

    if current_buffer:
        use_cases.append("\n".join(current_buffer))

    return use_cases


# --- ENDPOINT ---
@router.get("/")
def health_check():
    return {"health": "OK"}


@router.post("/", status_code=201)
def create_new_chat(chat_data: ChatCreate, session: Session = Depends(get_db_session)):
    """Creates a fresh, empty chat session."""
    new_chat = Chat(name=chat_data.name, user_id=chat_data.user_id)
    session.add(new_chat)
    session.commit()
    session.refresh(new_chat)
    return new_chat


@router.get("/user/{user_id}")
def get_user_chats(user_id: int, session: Session = Depends(get_db_session)):
    """Fetches all chats for the sidebar, ordered by newest first."""
    statement = (
        select(Chat).where(Chat.user_id == user_id).order_by(Chat.created_at.desc())
    )
    return session.exec(statement).all()


@router.post("/test-case")
def generate_test_case(
    query: UserQuery,
    llm=Depends(get_llm),
    embedder=Depends(get_embedding_model),
    collection=Depends(get_rag_collection),
    session: Session = Depends(get_db_session),  # <--- Inject Database Session
):
    # 1. Verify Chat Exists
    chat = session.get(Chat, query.chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # 2. Save User Message to SQLite
    user_msg = Message(chat_id=query.chat_id, role="user", content=query.text)
    session.add(user_msg)
    session.commit()

    # 3. RAG Retrieval (Convert integer ID to string for ChromaDB metadata filtering)
    query_vec_resp = embedder.create_embedding(query.text)
    query_vec = query_vec_resp["data"][0]["embedding"]

    results = collection.query(
        query_embeddings=[query_vec],
        n_results=3,
        where={
            "chat_id": str(query.chat_id)
        },  # ChromaDB requires string/int/float values
    )

    # 4. Build Schema & Inference

    if not results["documents"] or not results["documents"][0]:
        context_text = "No context found. Rely on general QA best practices."
    else:
        context_text = "\n\n".join(results["documents"][0])

    dynamic_schema = build_dynamic_json_schema(query.columns)

    output = llm.create_chat_completion(
        messages=[
            {
                "role": "system",
                "content": "You are a top software tester. Your sole task is to generate a JSON array of test cases based on a given requirement. Consider edge cases and negative cases. Each case, unless told otherwise, must have the following keys: 'id' (if not specified, start as 'TC-001'), 'scenario', 'prerequisites', 'steps', 'data' in array or null, 'expected' in array, 'actual' null, 'status' null. Only output a single JSON object in 'cases' array. Texts in test cases must be concise.\n\nExample:\n{\"id\":\"TC-001\",\"scenario\":\"Verify theme toggle to Dark Mode\",\"prerequisites\":[\"App is in default Light Mode\"],\"steps\":[\"Navigate to Appearance Settings\",\"Click the 'Dark Mode' toggle\"],\"data\":null,\"expected\":[\"UI background changes to dark hex colors\",\"Text colors switch to light contrast\",\"Preference persists after refresh\"],\"actual\":null,\"status\":null}",
            },
            {
                "role": "user",
                "content": f"Documentation Context:\n{context_text}\n--END OF CONTEXT--\n\nGenerate test cases for the following requirement: {query.text}",
            },
        ],
        response_format={"type": "json_object", "schema": dynamic_schema},
        temperature=0.1,
        max_tokens=2048,
    )

    raw_json_string = output["choices"][0]["message"]["content"]

    try:
        data = json.loads(raw_json_string)

        # 5. Save AI Response to SQLite
        ai_msg = Message(
            chat_id=query.chat_id,
            role="assistant",
            content=json.dumps(data),  # Save the JSON payload as a string
        )
        session.add(ai_msg)
        session.commit()

        return data

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Failed to parse structured output."
        )


@router.post("/download")
async def download_test_cases_csv(test_cases: List[Dict[str, Any]]):
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases provided")

    # Process data for CSV compatibility
    for item in test_cases:
        for key, value in item.items():
            # If the LLM generated a list for this column, flatten it for the CSV cell
            if isinstance(value, list):
                if key == "steps":
                    # Numbered list for steps
                    item[key] = "\n".join(
                        f"{i+1}. {step}" for i, step in enumerate(value)
                    )
                else:
                    # Bulleted list for other list types (prerequisites, data, expected)
                    item[key] = "\n".join(f"- {v}" for v in value)

    # Create Pandas DataFrame directly from the dynamic dictionaries
    df = pd.DataFrame(test_cases)

    # Write CSV to an in-memory buffer
    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")

    # Prepare the response
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=test_cases.csv"

    return response


@router.post("/upload")
async def upload_document(
    chat_id: str = Form(...),  # Client must send the chat_id along with the file
    file: UploadFile = File(...),
    embed_model=Depends(get_embedding_model),
    collection=Depends(get_rag_collection),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 1. Save file temporarily because pdfplumber needs a file path
    temp_path = f"./temp_{uuid4()}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Extract Use Cases
        documents = extract_use_cases(temp_path)
        if not documents:
            raise HTTPException(status_code=400, detail="No extractable text found.")

        # 3. Embed and Store
        for doc in documents:
            response = embed_model.create_embedding(doc)
            vector = response["data"][0]["embedding"]

            # Store with chat_id in metadata
            collection.add(
                documents=[doc],
                embeddings=[vector],
                metadatas=[
                    {
                        "source": file.filename,
                        "type": "use_case_spec",
                        "chat_id": chat_id,  # <--- CRITICAL: Isolates document to this chat
                    }
                ],
                ids=[str(uuid4())],
            )

        return {
            "message": "Document ingested successfully.",
            "use_cases_found": len(documents),
            "chat_id": chat_id,
        }

    finally:
        # 4. Clean up the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/{chat_id}/history")
def get_chat_history(chat_id: int, session: Session = Depends(get_db_session)):
    # Verify chat exists
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Query messages related to this chat, ordered by creation time
    statement = (
        select(Message).where(Message.chat_id == chat_id).order_by(Message.timestamp)
    )
    messages = session.exec(statement).all()

    return messages


@router.patch("/{chat_id}/move")
def move_chat(
    chat_id: int, move_data: ChatMove, session: Session = Depends(get_db_session)
):
    # 1. Verify the chat exists
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 2. If moving INTO a folder, verify the folder exists
    if move_data.folder_id is not None:
        folder = session.get(Folder, move_data.folder_id)
        if not folder:
            raise HTTPException(status_code=404, detail="Target folder not found")

    # 3. Update and save
    chat.folder_id = move_data.folder_id
    session.add(chat)
    session.commit()
    session.refresh(chat)

    status_msg = (
        f"Moved to folder {move_data.folder_id}"
        if move_data.folder_id
        else "Removed from folder"
    )
    return {"message": status_msg, "chat_id": chat.id, "folder_id": chat.folder_id}


@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int,
    session: Session = Depends(get_db_session),
    collection=Depends(get_rag_collection),
):
    # 1. Verify chat exists
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 2. Delete Messages from SQLite
    statement = select(Message).where(Message.chat_id == chat_id)
    messages = session.exec(statement).all()
    for msg in messages:
        session.delete(msg)

    # 3. Delete Document Vectors from ChromaDB
    # This prevents orphaned vector data from taking up disk space
    collection.delete(where={"chat_id": str(chat_id)})

    # 4. Delete Chat from SQLite
    session.delete(chat)
    session.commit()

    return {"message": f"Chat {chat_id} and its associated data deleted successfully"}


@router.patch("/{chat_id}/rename")
def rename_chat(
    chat_id: int, rename_data: ChatRename, session: Session = Depends(get_db_session)
):
    # 1. Verify chat exists
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 2. Update name and save
    chat.name = rename_data.name
    session.add(chat)
    session.commit()
    session.refresh(chat)

    return {
        "message": "Chat renamed successfully",
        "chat_id": chat.id,
        "new_name": chat.name,
    }
