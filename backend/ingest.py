import os
import glob
import pdfplumber
import chromadb
from llama_cpp import Llama
from uuid import uuid4

# --- CONFIGURATION ---
PDF_DIRECTORY = "../../TestRag.pdf"
DB_PATH = "database/vector"
MODEL_PATH = "local/Qwen3-Embedding-4B-Q8_0.gguf"

# --- 1. SETUP MODEL & DB ---
print("Loading Qwen3-Embedding model...")
llm_embed = Llama(
    n_ctx=4096,
    model_path=MODEL_PATH,
    embedding=True,
    verbose=False,
    n_gpu_layers=-1
)

print("Connecting to ChromaDB...")
client = chromadb.PersistentClient(path=DB_PATH)
# We use a new collection to avoid mixing with old generic data
collection = client.get_or_create_collection(name="use_case_knowledge")

# --- 2. SEMANTIC PARSING FUNCTION ---
def extract_use_cases(pdf_path):
    print(f"Processing: {pdf_path}")

    all_rows = []

    # Step A: Aggregate ALL table rows from ALL pages first
    # This solves the issue of tables spanning across pages
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                # Filter out empty rows or tiny artifacts
                cleaned_rows = [row for row in table if any(row)]
                all_rows.extend(cleaned_rows)

    # Step B: Reconstruct Logical Use Cases
    use_cases = []
    current_buffer = []

    # We iterate through every row found in the PDF
    for row in all_rows:
        # Safety check for column count
        if len(row) < 2: continue
        
        # Clean whitespace
        field = row[0].strip() if row[0] else ""
        value = row[1].strip() if row[1] else ""
        
        # DETECT NEW USE CASE START
        # Usually starts with "Use Case Name" or "Use Case ID"
        if "Use Case Name" in field or "Use Case ID" in field:
            # If we were building a previous use case, save it now
            # (But only if we encounter a *duplicate* header that signals a NEW case)
            if "Use Case Name" in field and current_buffer:
                use_cases.append("\n".join(current_buffer))
                current_buffer = []
        
        # Formatting Logic:
        # If 'Field' is present, it's a new header (e.g., "Pre-Condition")
        if field:
            current_buffer.append(f"\n### {field}:")
        
        # If 'Value' is present, add it. 
        # If it's a multiline step (like flow of events), keep formatting.
        if value:
            current_buffer.append(value)

    # Add the final use case in the buffer
    if current_buffer:
        use_cases.append("\n".join(current_buffer))
        
    return use_cases

# --- 3. MAIN INGESTION LOOP ---
def main():
    # pdf_files = glob.glob(os.path.join(PDF_DIRECTORY, "*.pdf"))
    pdf_files = glob.glob(PDF_DIRECTORY)
    
    if not pdf_files:
        print("- No PDF files found. -")
        return

    for pdf_file in pdf_files:
        # A. Semantic Extract
        # Instead of getting one giant text, we get a list of "Use Cases"
        documents = extract_use_cases(pdf_file)
        
        if not documents:
            print(f"- Warning: No use cases found in {pdf_file} -")
            continue
            
        print(f"Identified {len(documents)} distinct Use Cases.")

        # B. Embed & Store
        # We embed each Use Case as a WHOLE document.
        # This is better than splitting by 1000 chars, which breaks logic.
        for i, doc in enumerate(documents):
            # Extract a title for metadata (first line usually has the name)
            # Safe slice to find the first line
            first_line = doc.split('\n')[1] if len(doc.split('\n')) > 1 else "Unknown"
            
            print(f"Embedding: {first_line[:50]}...")
            
            # Generate Embedding
            response = llm_embed.create_embedding(doc)
            vector = response['data'][0]['embedding']
            
            # Store
            collection.add(
                documents=[doc],
                embeddings=[vector],
                metadatas=[{"source": os.path.basename(pdf_file), "type": "use_case_spec"}],
                ids=[str(uuid4())]
            )
            
    print("Ingestion Complete. Data saved to chroma_db/")

if __name__ == "__main__":
    main()
