import hashlib
import pypdf
from io import BytesIO
from typing import Optional
from app.services.vector_db import vector_service
from langchain_huggingface import HuggingFaceEmbeddings

embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_pdf(
    file_content: bytes,
    filename: str,
    session_id: str,
    user_id: Optional[str] = None,
) -> int:
    # 1. Extract text
    pdf_reader = pypdf.PdfReader(BytesIO(file_content))
    text = ""
    for page in pdf_reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    if not text.strip():
        return 0

    # 2. Chunking
    chunks = [text[i:i + 1000] for i in range(0, len(text), 1000)]

    # 3. Embed + upsert
    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
            
        # --- THE STABLE ID LOGIC (MUST BE INSIDE THE LOOP) ---
        # We need 'i' from the enumerate() above to make each chunk unique
        unique_str = f"{filename}_{session_id}_{i}"
        stable_id = int(hashlib.md5(unique_str.encode()).hexdigest(), 16) % (10 ** 10)
        
        vector = embeddings_model.embed_query(chunk)
        payload = {
            "text":       chunk,
            "source":     filename,
            "session_id": session_id,
        }
        if user_id:
            payload["user_id"] = user_id

        vector_service.client.upsert(
            collection_name=vector_service.collection_name,
            points=[{
                "id":      stable_id,
                "vector":  vector,
                "payload": payload,
            }],
        )

    return len(chunks)