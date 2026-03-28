from llama_cpp import Llama
import chromadb
from sqlmodel import Session
from db import engine

# Global variables to hold models in memory
test_case_llm = None
test_script_llm = None
embed_model = None
chroma_collection = None

def get_db_session():
    with Session(engine) as session:
        yield session

def get_test_case_llm():
    if test_case_llm is None:
        raise RuntimeError("Test case LLM not loaded. Check lifespan events.")
    return test_case_llm

def get_test_script_llm():
    # if test_script_llm is None:
    #     raise RuntimeError("Test script LLM not loaded. Check lifespan events.")
    return test_script_llm

def get_embedding_model():
    if embed_model is None:
        raise RuntimeError("Embedding model not loaded. Check lifespan events.")
    return embed_model

def get_rag_collection():
    if chroma_collection is None:
        raise RuntimeError("ChromaDB not connected. Check lifespan events.")
    return chroma_collection