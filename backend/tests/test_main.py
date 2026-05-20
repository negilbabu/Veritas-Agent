import pytest
from unittest.mock import patch, MagicMock
from app.main import get_optional_user_id, _fallback_title

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200

@patch("app.main.process_pdf")
@patch("app.main.generate_chat_title")
@patch("app.main.save_message")
def test_upload_document(mock_save, mock_title, mock_process, client):
    mock_process.return_value = 5
    mock_title.return_value = "Test Title"
    files = {"file": ("test.pdf", b"content", "application/pdf")}
    response = client.post("/upload", files=files)
    assert response.status_code == 200

@patch("app.main.app_instance.ainvoke")
def test_generate_chat_title_function(mock_invoke):
    from app.main import generate_chat_title
    mock_invoke.return_value = {"messages": [MagicMock(content="Generated Chat Title")]}
    
    import asyncio
    title = asyncio.run(generate_chat_title("clinical_notes.pdf", source="file"))
    assert "notes" in title.lower() or "generated" in title.lower()

@patch("app.main.app_instance.ainvoke")
@patch("app.main.generate_chat_title")
def test_chat_new_session(mock_title, mock_invoke, client):
    mock_title.return_value = "New Title"
    mock_invoke.return_value = {"messages": [MagicMock(content="Hello")], "documents": []}
    response = client.get("/chat", params={"query": "Hi"})
    assert response.status_code == 200

@patch("app.main.app_instance.ainvoke")
def test_chat_existing_session(mock_invoke, client, mocker):
    mock_db = MagicMock()
    mocker.patch("app.main.SessionLocal", return_value=mock_db)
    
    mock_msg = MagicMock(title="Old Chat")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_msg
    mock_invoke.return_value = {"messages": [MagicMock(content="Rep")], "documents": []}
    
    response = client.get("/chat", params={"query": "test", "session_id": "exists"})
    assert response.status_code == 200

def test_get_all_sessions_guest(client):
    response = client.get("/sessions")
    assert response.status_code == 200

@patch("app.main.SessionLocal")
def test_get_all_sessions_authenticated(mock_session_factory, client):
    client.app.dependency_overrides[get_optional_user_id] = lambda: "user-123"
    mock_db = MagicMock()
    mock_session_factory.return_value = mock_db
    
    mock_db.query().join().order_by().all.return_value = [
        MagicMock(session_id="s1", title="Title 1"),
        MagicMock(session_id="s1", title="Title 1 Duplicate")
    ]
    response = client.get("/sessions")
    assert response.status_code == 200

@patch("app.main.get_history")
def test_fetch_history_access_denied(mock_history, client):
    mock_msg = MagicMock(user_id="owner-id")
    mock_history.return_value = [mock_msg]
    
    client.app.dependency_overrides[get_optional_user_id] = lambda: "unauthorized-id"
    
    response = client.get("/sessions/sess-1/history")
    assert response.status_code == 403

def test_delete_session(client, mocker):
    mock_db = MagicMock()
    mocker.patch("app.main.SessionLocal", return_value=mock_db)
    mocker.patch("app.services.vector_db.vector_service.client.delete")
    
    response = client.delete("/sessions/sess-1")
    assert response.status_code == 200

def test_fallback_title_logic():
    assert _fallback_title("clinical_notes.pdf") == "clinical notes"
    assert _fallback_title("x" * 50) == "x" * 30 + "…"

def test_get_optional_user_id_no_credentials():
    # Covers the initial fallback exit branches inside main.py
    assert get_optional_user_id(None) is None