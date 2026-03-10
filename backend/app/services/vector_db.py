from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_huggingface import HuggingFaceEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

class VectorService:
    def __init__(self):
        self.client = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"), 
            port=int(os.getenv("QDRANT_PORT", 6333))
        )
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.collection_name = "veritas_docs"
        self._ensure_collection()

    def _ensure_collection(self):
        # We check if it exists
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        
        if not exists:
            # Create with 384 dimensions for all-MiniLM-L6-v2
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )

    def search(self, query_text, session_id: str, limit=3):
        query_vector = self.embeddings.embed_query(query_text)
        #  Filter results so we ONLY see documents for THIS session
        search_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="session_id", 
                    match=models.MatchValue(value=session_id)
                )
            ]
        )
        response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=search_filter, # Apply the filter!
            limit=limit
        )
        return response.points

# Create a singleton instance
vector_service = VectorService()