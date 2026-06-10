import pytest
from unittest.mock import patch, MagicMock
from app.services.vector_db import vector_service

def test_vector_db_initialization_cloud(monkeypatch):
    """Test cloud path behavior selection branch when variables are active."""
    monkeypatch.setenv("QDRANT_URL", "https://mock-cloud-qdrant.io")
    monkeypatch.setenv("QDRANT_API_KEY", "mock-api-key")
    
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_client:
        mock_instance = MagicMock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collections.return_value.collections = []
        
        from app.services.vector_db import VectorService
        service = VectorService()
        assert service.collection_name == "veritas_docs"
        mock_instance.create_collection.assert_called_once()

def test_vector_db_initialization_local_fallback(monkeypatch):
    """Test local Docker fallback parameters when environment configs are missing."""
    monkeypatch.delenv("QDRANT_URL", raising=False)
    monkeypatch.delenv("QDRANT_API_KEY", raising=False)
    monkeypatch.setenv("QDRANT_HOST", "localhost")
    monkeypatch.setenv("QDRANT_PORT", "6333")
    
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_client:
        mock_instance = MagicMock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collections.return_value.collections = []
        
        from app.services.vector_db import VectorService
        service = VectorService()
        assert service.client == mock_instance

def test_vector_db_search_points():
    """Test standard point matrix generation mapping workflows inside search routines."""
    from app.services.vector_db import vector_service
    
    mock_client = MagicMock()
    vector_service.client = mock_client
    
    mock_points_resp = MagicMock()
    mock_points_resp.points = [MagicMock(id=1, payload={"text": "found context"})]
    mock_client.query_points.return_value = mock_points_resp
    
    results = vector_service.search(query_text="diagnostic criteria", session_id="session-xyz")
    assert len(results) == 1
    mock_client.query_points.assert_called_once()

def test_ensure_collection_exception_logging():
    """Verify that exceptions thrown inside collection matching logic are logged safely."""
    from app.services.vector_db import vector_service
    mock_client = MagicMock()
    vector_service.client = mock_client
    
    # Simulate a clean connection crash to assert error log handling paths
    mock_client.get_collections.side_effect = Exception("Mocked connection breakdown scenario")
    
    with patch("app.services.vector_db.log.info") as mock_log:
        vector_service._ensure_collection()
        mock_log.assert_any_call("--- ERROR in _ensure_collection: Mocked connection breakdown scenario ---")

def test_vector_db_cloud_initialization_failure(monkeypatch):
    """Test cloud connection handling path when initialization validation fails."""
    monkeypatch.setenv("QDRANT_URL", "https://mock-cloud-qdrant.io")
    monkeypatch.setenv("QDRANT_API_KEY", "mock-api-key")
    
    with patch("app.services.vector_db.QdrantClient") as mock_qdrant_client:
        mock_instance = MagicMock()
        mock_qdrant_client.return_value = mock_instance
        # Simulate an immediate testing connection failure
        mock_instance.get_collections.side_effect = Exception("Cloud auth rejected")
        
        from app.services.vector_db import VectorService
        with pytest.raises(Exception) as exc:
            VectorService()
        assert "Cloud auth rejected" in str(exc.value)