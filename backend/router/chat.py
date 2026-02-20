import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
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

router = APIRouter(prefix="/api/chat", tags=["RAG Generation"])


# --- SCHEMAS ---
class UserQuery(BaseModel):
    text: str
    chat_id: str


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


# --- HELPER: CONSTRUCT PROMPT ---
def build_prompt(query, context_chunks):
    context_text = "\n\n".join(context_chunks)

    return f"""<|im_start|>system
You are a QA Lead. You generate structured Test Cases based strictly on the provided documentation.
Output ONLY valid JSON. No markdown, no conversational text.

Required JSON Structure:
{{
  "id": "TC-001",
  "scenario": "Short summary of what is being tested",
  "prerequisites": "Pre-conditions mentioned in docs",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "data": "Any specific data used (e.g., valid username)",
  "expected": "Expected result from docs",
  "actual": "",
  "status": ""
}}
<|im_end|>
<|im_start|>user
Documentation Context:
{context_text}

Task: Generate a test case for the following requirement: "{query}"
<|im_end|>
<|im_start|>assistant
{{"""


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


@router.post("/test-case")
def generate_test_case(
    query: UserQuery,
    llm=Depends(get_llm),
    embedder=Depends(get_embedding_model),
    collection=Depends(get_rag_collection),
):
    # 1. Embed the search query
    query_vec_resp = embedder.create_embedding(query.text)
    query_vec = query_vec_resp["data"][0]["embedding"]

    # 2. RAG Retrieval with Isolation
    results = collection.query(
        query_embeddings=[query_vec],
        n_results=3,
        where={
            "chat_id": query.chat_id
        },  # <--- Chroma will only query records that have this specific metadata value.
    )

    context_chunks = results["documents"][0] if results["documents"] else "No context"
    # END RETRIEVAL

    # 2. Build Prompt
    prompt = build_prompt(query.text, context_chunks)

    # 3. Inference
    # response_format={"type": "json_object"} is supported in some versions,
    # but manually starting the prompt with "{" is the most robust local method.
    output = llm(
        prompt,
        max_tokens=2048,
        stop=["<|im_end|>"],
        temperature=0.1,  # Low temp for strict formatting
        echo=False,
    )

    raw_text = output["choices"][0]["text"]

    # 4. Clean & Parse JSON
    # Since we manually added "{" at the end of the prompt to force start,
    # we need to add it back to the response string.
    json_str = "{" + raw_text.strip()

    try:
        # Try to fix common LLM json errors (trailing commas, markdown blocks)
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]

        data = json.loads(json_str)

        # Ensure 'steps' is a list (LLM might make it a string)
        if isinstance(data.get("steps"), str):
            data["steps"] = [s.strip() for s in data["steps"].split("\n") if s.strip()]

        return data

    except json.JSONDecodeError as e:
        print(f"JSON Fail: {json_str}")
        raise HTTPException(
            status_code=500, detail="LLM failed to generate valid JSON. Try again."
        )


@router.post("/download")
async def download_test_cases_csv(test_cases: List[TestCaseResponse]):
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases provided")

    # 1. Convert Pydantic models to a list of dictionaries
    data = [tc.model_dump() for tc in test_cases]

    # 2. Process data for CSV compatibility
    for item in data:
        # Join the list of steps into a single string with newlines for the CSV cell
        if isinstance(item.get("steps"), list):
            item["prerequisites"] = "\n".join(
                f"- {preq}" for preq in item["prerequisites"]
            )
            item["steps"] = "\n".join(
                f"{i+1}. {step}" for i, step in enumerate(item["steps"])
            )
            item["data"] = "\n".join(f"- {data}" for data in item["data"])
            item["expected"] = "\n".join(
                f"- {expected}" for expected in item["expected"]
            )

    # 3. Create Pandas DataFrame
    df = pd.DataFrame(data)

    # 4. Write CSV to an in-memory buffer
    stream = io.StringIO()
    df.to_csv(
        stream, index=False, encoding="utf-8-sig"
    )  # utf-8-sig for Excel compatibility

    # 5. Prepare the response
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

        # Optional: Verify the folder belongs to the same user as the chat
        if folder.user_id != chat.user_id:
            raise HTTPException(
                status_code=403, detail="Folder belongs to a different user"
            )

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
