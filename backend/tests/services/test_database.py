import pytest
from unittest.mock import patch, MagicMock
from app.services import database

@patch("app.services.database.SessionLocal")
def test_save_message(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.save_message("sess-1", "user", "hello", "title", "user-123")
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

@patch("app.services.database.SessionLocal")
def test_get_history(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.get_history("sess-1")
    mock_db.query().filter().order_by().all.assert_called_once()

@patch("app.services.database.SessionLocal")
def test_get_user_by_email(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.get_user_by_email("t@t.com")
    mock_db.query().filter().first.assert_called_once()

@patch("app.services.database.SessionLocal")
def test_get_user_by_id(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.get_user_by_id("123")
    mock_db.query().filter().first.assert_called_once()

@patch("app.services.database.SessionLocal")
def test_create_user(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    user = database.create_user("t@t.com", "Name")
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    assert user.email == "t@t.com"

@patch("app.services.database.SessionLocal")
def test_delete_user_data(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.delete_user_data("123")
    assert mock_db.query().filter().delete.call_count == 2
    mock_db.commit.assert_called_once()

@patch("app.services.database.SessionLocal")
def test_claim_session_history(mock_session_local):
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    database.claim_session_history("sess-1", "123")
    mock_db.query().filter().update.assert_called_once()
    mock_db.commit.assert_called_once()

@patch("app.services.database.Base.metadata.create_all")
def test_init_db(mock_create_all):
    database.init_db()
    mock_create_all.assert_called_once()