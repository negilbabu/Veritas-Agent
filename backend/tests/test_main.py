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
    files = {"file": ("test.pdf", b"content", "application/pdf")}
    response = client.post("/upload", files=files, data={"session_id": "sess-123"})
    assert response.status_code == 200

@pytest.mark.asyncio
@patch("app.main.app_instance.ainvoke")
@patch("app.main.generate_chat_title")
async def test_chat_new_session(mock_title, mock_invoke, client):
    mock_title.return_value = "New Title"
    mock_invoke.return_value = {"messages": [MagicMock(content="Hello")], "documents": []}
    response = client.get("/chat", params={"query": "Hi"})
    assert response.status_code == 200
    assert response.json()["is_new_session"] is True

@pytest.mark.asyncio
@patch("app.main.app_instance.ainvoke")
async def test_chat_existing_session(mock_invoke, client, mocker):
    # Patch SessionLocal inside app.main
    mock_db = MagicMock()
    mocker.patch("app.main.SessionLocal", return_value=mock_db)
    
    mock_msg = MagicMock(title="Old Chat")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_msg
    mock_invoke.return_value = {"messages": [MagicMock(content="Rep")], "documents": []}
    
    response = client.get("/chat", params={"query": "test", "session_id": "exists"})
    assert response.status_code == 200
    assert response.json()["chat_title"] == "Old Chat"