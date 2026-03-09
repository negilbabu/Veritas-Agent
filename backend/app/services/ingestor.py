import pypdf
from io import BytesIO
from app.services.vector_db import vector_service
from langchain_huggingface import HuggingFaceEmbeddings
from app.services.vector_db import vector_service

embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_pdf(file_content: bytes, filename: str):
    # 1. Extract Text
    pdf_reader = pypdf.PdfReader(BytesIO(file_content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"

    # 2. Basic Chunking (Simple for now, can be optimized later)
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    # 3. Upload to Qdrant
    # Note: We're still using a dummy vector [0.1]*384 until we add the LLM 
    for i, chunk in enumerate(chunks):
        vector = embeddings_model.embed_query(chunk) # Real vector!
        vector_service.client.upsert(
            collection_name=vector_service.collection_name,
            points=[
                {
                    "id": hash(f"{filename}_{i}") % 10**10,
                    "vector": vector, 
                    "payload": {"text": chunk, "source": filename}
                }
            ]
        )
    return len(chunks)