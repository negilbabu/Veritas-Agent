import os
import sys
import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
from app.core.logging import log


load_dotenv()

class VectorService:
    def __init__(self):
        # 1. Fetch variables and STRIP them (removes accidental spaces/newlines)
        url = os.getenv("QDRANT_URL", "").strip()
        api_key = os.getenv("QDRANT_API_KEY", "").strip()

        # 2. Forced Debugging (This will show up in Render logs)
        log.info(f"--- QDRANT DEBUG: URL found: {'Yes' if url else 'No'} ---")
        
        if url and api_key:
            log.info(f"--- ATTEMPTING CLOUD CONNECTION: {url} ---")
            try:
                self.client = QdrantClient(url=url, api_key=api_key)
                # Test connection immediately
                self.client.get_collections() 
                log.info("--- SUCCESS: Veritas is connected to Qdrant Cloud! ---")
            except Exception as e:
                log.info(f"--- CRITICAL: Cloud Connection Failed: {e} ---")
                raise e
        else:
            # Fallback for local Docker
            log.info("--- INFO: No Cloud credentials. Falling back to Local Qdrant. ---")
            host = os.getenv("QDRANT_HOST", "qdrant")
            port = int(os.getenv("QDRANT_PORT", 6333))
            self.client = QdrantClient(host=host, port=port)

        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.collection_name = "veritas_docs"
        self._ensure_collection()

    def _ensure_collection(self):
        # We wrap this in a try/except to catch the "Connection Refused" early
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            
            if not exists:
                log.info(f"--- CREATING COLLECTION: {self.collection_name} ---")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
                )
            # Qdrant Cloud requires an index to filter by session_id effectively
            log.info(f"Ensuring payload index for session_id in {self.collection_name}")
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="session_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception as e:
            log.info(f"--- ERROR in _ensure_collection: {e} ---")
            # If we are on Render and this fails, it's a configuration error
            if os.getenv("RENDER"):
                sys.exit(1)

    def search(self, query_text, session_id: str, limit=10):
        query_vector = self.embeddings.embed_query(query_text)
        search_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="session_id", 
                    match=models.MatchValue(value=str(session_id))
                )
            ]
        )
        response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=search_filter,
            limit=limit
        )
        return response.points

vector_service = VectorService()