import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from db import create_db_and_tables
import dependency # Import the module to modify globals
from router import auth, chat, folder, profile
from llama_cpp import Llama
import chromadb
from fastapi.middleware.cors import CORSMiddleware

# --- LIFECYCLE MANAGER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load DB
    create_db_and_tables()
    
    # 2. Load LLM (The 4B model)
    print("8 Loading LLM into RAM...")
    dependency.llm_model = Llama(
        model_path="local/qwen3-4b-instruct-2507.Q8_0.gguf", # Update filename if needed
        n_ctx=8192,
        n_gpu_layers=-1, # Offload to GPU
        verbose=False
    )

    # 3. Load Embedding Model
    print("8 Loading Embedding Model into RAM...")
    dependency.embed_model = Llama(
        model_path="local/Qwen3-Embedding-4B-Q8_0.gguf", # Must match ingest.py model
        n_ctx=8192,
        embedding=True, # <--- CRITICAL FLAG
        verbose=False,
        n_gpu_layers=-1
    )

    # 4. Load Vector DB
    print("8 Connecting to ChromaDB...")
    client = chromadb.PersistentClient(path="database/vector")
    dependency.chroma_collection = client.get_collection("use_case_knowledge")
    
    print("1 System Ready!")
    yield
    # Cleanup (if needed) goes here

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # อนุญาต Next.js
    allow_credentials=True,
    allow_methods=["*"], # อนุญาตทุก Method (รวมถึง OPTIONS, POST, GET)
    allow_headers=["*"], # อนุญาตทุก Headers
)

app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(folder.router, prefix="/api")
app.include_router(profile.router, prefix="/api")

# --- HEALTH CHECK ---
@app.get("/")
def health_check():    
    return {"health": "OK"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
