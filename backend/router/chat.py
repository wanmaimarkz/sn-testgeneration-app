import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from llama_cpp import Llama
from dependency import get_embedding_model, get_llm, get_rag_collection, get_db_session
# from router.auth import get_current_user # Assuming you moved auth logic to a helper
# from model import User
import csv
import io
from fastapi.responses import StreamingResponse
from datetime import datetime


router = APIRouter(prefix="/chat", tags=["RAG Generation"])

# --- SCHEMAS ---
class UserQuery(BaseModel):
    text: str

class TestCaseResponse(BaseModel):
    id: str
    scenario: str
    prerequisites: List[str]
    steps: List[str]
    data: List[str]
    expected: List[str]
    actual: str = ""
    status: str = ""

class ExportRequest(BaseModel):
    test_cases: List[TestCaseResponse]

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

# --- ENDPOINT ---
@router.get("/")
def health_check():    
    return {"health": "OK"}

@router.post("/test-case")
def generate(
    query: UserQuery,
    llm: Llama = Depends(get_llm),
    embedder: Llama = Depends(get_embedding_model), # <--- Inject Embedding Model
    collection = Depends(get_rag_collection)
):
    # 1. Embed Query
    query_vec_resp = embedder.create_embedding(query.text)
    query_vec = query_vec_resp['data'][0]['embedding']
    
    # 2. Search using Vector
    results = collection.query(
        query_embeddings=[query_vec], # <--- Search by vector, not text
        n_results=3
    )
    
    # ... rest of the code ...
    context_chunks = results['documents'][0]
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
        temperature=0.1, # Low temp for strict formatting
        echo=False
    )
    
    raw_text = output['choices'][0]['text']
    
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
        if isinstance(data.get('steps'), str):
            data['steps'] = [s.strip() for s in data['steps'].split('\n') if s.strip()]

        return data
        
    except json.JSONDecodeError as e:
        print(f"JSON Fail: {json_str}")
        raise HTTPException(status_code=500, detail="LLM failed to generate valid JSON. Try again.")

@router.post("/download-test-case")
def download_test_cases_csv(request: ExportRequest):
    """
    Converts a list of JSON test cases into a CSV file for download.
    Handles 'steps' list by joining them with newlines.
    """
    
    # 1. Create an in-memory string buffer
    output = io.StringIO()
    
    # 2. Define CSV Headers matching your schema
    headers = ['id', 'scenario', 'prerequisites', 'steps', 'data', 'expected', 'actual', 'status']
    
    # 3. Write Data
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    
    for tc in request.test_cases:
        # Create a clean dict for writing
        row = {
            'id': tc.id,
            'scenario': tc.scenario,
            'prerequisites': "\n".join([f"{i+1}. {preq}" for i, preq in enumerate(tc.prerequisites)]),
            # Convert list of steps ["Do A", "Do B"] -> string "1. Do A\n2. Do B"
            'steps': "\n".join([f"{i+1}. {step}" for i, step in enumerate(tc.steps)]),
            'data': "\n".join([f"{i+1}. {data}" for i, data in enumerate(tc.data)]),
            'expected': "\n".join([f"{i+1}. {expc}" for i, expc in enumerate(tc.expected)]),
            'actual': "\n".join([f"{i+1}. {actl}" for i, actl in enumerate(tc.actual)]),
            'status': tc.status
        }
        writer.writerow(row)

    # 4. Prepare Stream
    output.seek(0)
    
    # Generate a filename with timestamp
    filename = f"test_cases_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # 5. Return as Downloadable File
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
