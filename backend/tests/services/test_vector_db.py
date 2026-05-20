import pytest
from unittest.mock import patch, MagicMock
from app.services import vector_db

def test_vector_db_initialization_local(monkeypatch):
    # Fix the AttributeError by clearing env vars instead of patching module attributes
    monkeypatch.delenv("QDRANT_URL", raising=False)
    monkeypatch.delenv("QDRANT_API_KEY", raising=False)
    
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_client:
        # Instantiate a fresh instance to trigger the local fallback logic branch
        service = vector_db.VectorService()
        assert service is not None
        mock_qdrant_client.assert_called()

def test_ensure_collection_operational_error_retry():
    # Fix the AssertionError by patching the client constructor BEFORE instantiating the class
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_class:
        mock_client = MagicMock()
        mock_qdrant_class.return_value = mock_client
        
        # Simulate connection failure followed by success
        from qdrant_client.errors import UnexpectedResponse
        mock_client.collection_exists.side_effect = [UnexpectedResponse(500, "Runtime Error"), True]
        
        with patch("time.sleep") as mock_sleep:
            service = vector_db.VectorService()
            assert mock_sleep.call_count == 1