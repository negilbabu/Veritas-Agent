import pytest
from unittest.mock import patch, MagicMock
from app.services.vector_db import vector_service

def test_vector_db_initialization_local(monkeypatch):
    monkeypatch.delenv("QDRANT_URL", raising=False)
    monkeypatch.delenv("QDRANT_API_KEY", raising=False)
    
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_client:
        from app.services.vector_db import VectorService
        service = VectorService()
        assert service is not None

def test_vector_db_search_points():
    mock_client = MagicMock()
    vector_service.client = mock_client
    
    mock_points_resp = MagicMock()
    mock_points_resp.points = [MagicMock(id=1, payload={"text": "found context"})]
    mock_client.query_points.return_value = mock_points_resp
    
    results = vector_service.search(query_text="diagnostic criteria", session_id="session-xyz")
    assert len(results) == 1

def test_ensure_collection_exception_logging():
    mock_client = MagicMock()
    vector_service.client = mock_client
    mock_client.get_collections.side_effect = Exception("Mocked breakdown")
    
    with patch("app.services.vector_db.log.info") as mock_log:
        vector_service._ensure_collection()
        mock_log.assert_any_call("--- ERROR in _ensure_collection: Mocked breakdown ---")