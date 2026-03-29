import pypdf
from io import BytesIO
from typing import Optional

# Do NOT import load_dotenv here — Docker injects env vars directly.
# The old load_dotenv() call was causing the confusing empty-path log line.

from app.services.vector_db import vector_service
from langchain_huggingface import HuggingFaceEmbeddings

embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def process_pdf(
    file_content: bytes,
    filename: str,
    session_id: str,
    user_id: Optional[str] = None,
) -> int:
    """
    Extract text from PDF, chunk it, embed each chunk and upsert into Qdrant.
    Vectors are tagged with session_id (always) and user_id (when authenticated)
    so they can be scoped per-user for GDPR deletion.
    Returns the number of chunks created.
    """
    # 1. Extract text
    pdf_reader = pypdf.PdfReader(BytesIO(file_content))
    text = ""
    for page in pdf_reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    if not text.strip():
        return 0

    # 2. Chunk (1000 chars, simple split — good enough for clinical docs)
    chunks = [text[i:i + 1000] for i in range(0, len(text), 1000)]

    # 3. Embed + upsert
    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
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
                "id":      hash(f"{filename}_{session_id}_{i}") % (10 ** 10),
                "vector":  vector,
                "payload": payload,
            }],
        )

    return len(chunks)