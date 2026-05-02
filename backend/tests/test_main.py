import pytest
from unittest.mock import patch, MagicMock

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@patch("app.main.process_pdf")
@patch("app.main.generate_chat_title")
@patch("app.main.save_message")
def test_upload_document_success(mock_save, mock_title, mock_process, client):
    mock_process.return_value = 5
    mock_title.return_value = "Test Chat Title"
    
    files = {"file": ("test.pdf", b"fake pdf content", "application/pdf")}
    data = {"session_id": "test-session"}
    
    response = client.post("/upload", files=files, data=data)
    
    assert response.status_code == 200
    assert "Processed test.pdf" in response.json()["message"]
    assert response.json()["chat_title"] == "Test Chat Title"

@patch("app.main.app_instance.ainvoke")
@patch("app.main.generate_chat_title")
def test_chat_new_session(mock_title, mock_invoke, client):
    mock_title.return_value = "New Query Title"
    mock_invoke.return_value = {
        "messages": [MagicMock(content="Hello! I am Veritas.")],
        "documents": ["source text"]
    }
    
    response = client.get("/chat", params={"query": "Who are you?"})
    
    assert response.status_code == 200
    assert response.json()["response"] == "Hello! I am Veritas."
    assert response.json()["is_new_session"] is True

def test_generate_chat_title_fallback():
    from app.main import _fallback_title
    assert _fallback_title("clinical_report_2024.pdf") == "clinical report 2024"
    assert _fallback_title("a" * 50) == "a" * 30 + "…"

@pytest.mark.asyncio
@patch("app.main.app_instance.ainvoke")
async def test_chat_existing_session(mock_invoke, client, mock_db):
    mock_msg = MagicMock(title="Old Chat")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_msg
    mock_invoke.return_value = {"messages": [MagicMock(content="Rep")], "documents": []}
    response = client.get("/chat", params={"query": "test", "session_id": "exists"})
    assert response.status_code == 200
    assert response.json()["chat_title"] == "Old Chat"

@patch("app.main.app_instance.ainvoke")
async def test_chat_existing_session(mock_invoke, client, mock_db):
    # Mocking an existing session find
    mock_msg = MagicMock(title="Old Chat")
    mock_db.query().filter().first.return_value = mock_msg
    mock_invoke.return_value = {"messages": [MagicMock(content="Rep")], "documents": []}
    
    response = client.get("/chat", params={"query": "test", "session_id": "exists"})
    assert response.status_code == 200
    assert response.json()["chat_title"] == "Old Chat"