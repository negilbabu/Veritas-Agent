import pytest
from unittest.mock import MagicMock, patch
from app.core.security import hash_password
from app.api.auth import get_current_verified_user, get_current_user

def test_register_success(client, mocker):
    mocker.patch("app.api.auth.get_user_by_email", return_value=None)
    mocker.patch("app.api.auth.create_user", return_value=MagicMock(id="123"))
    mocker.patch("app.api.auth.send_verification_email")
    mocker.patch("app.services.database.claim_session_history")
    
    response = client.post("/auth/register", json={
        "email": "new@test.com", "name": "Test", "password": "password123", "session_id": "sess-1"
    })
    assert response.status_code == 200

def test_register_short_password(client):
    response = client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "short"})
    assert response.status_code == 422

def test_register_long_password(client):
    response = client.post("/auth/register", json={"email": "a@b.com", "name": "A", "password": "x" * 75})
    assert response.status_code == 422

def test_register_already_registered(client, mocker):
    mocker.patch("app.api.auth.get_user_by_email", return_value=MagicMock())
    response = client.post("/auth/register", json={"email": "old@b.com", "name": "A", "password": "password123"})
    assert response.status_code == 409

def test_verify_email_success(client, mocker, mock_user_obj):
    mocker.patch("app.api.auth.decode_token", return_value={"sub": "123", "purpose": "verify_email"})
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    
    mock_user_obj.is_verified = False
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
    
    mocker.patch("app.api.auth.send_welcome_email")
    mocker.patch("app.api.auth.create_access_token", return_value="fake-jwt")
    
    response = client.get("/auth/verify", params={"token": "valid"})
    assert response.status_code == 200

def test_verify_email_already_verified(client, mocker, mock_user_obj):
    mocker.patch("app.api.auth.decode_token", return_value={"sub": "123", "purpose": "verify_email"})
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    
    mock_user_obj.is_verified = True
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
    
    response = client.get("/auth/verify", params={"token": "valid"})
    assert response.status_code == 200
    assert response.json()["already_verified"] is True

def test_verify_email_invalid_token(client, mocker):
    mocker.patch("app.api.auth.decode_token", return_value=None)
    response = client.get("/auth/verify", params={"token": "bad-token"})
    assert response.status_code == 400

def test_verify_email_user_not_found(client, mocker):
    mocker.patch("app.api.auth.decode_token", return_value={"sub": "missing", "purpose": "verify_email"})
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    response = client.get("/auth/verify", params={"token": "valid-token"})
    assert response.status_code == 404

def test_login_success(client, mocker, mock_user_obj):
    mocker.patch("app.api.auth.get_user_by_email", return_value=mock_user_obj)
    mocker.patch("app.api.auth.verify_password", return_value=True)
    mocker.patch("app.api.auth.create_access_token", return_value="jwt")
    
    response = client.post("/auth/login", json={"email": "t@t.com", "password": "pw"})
    assert response.status_code == 200

def test_login_unverified_email(client, mocker, mock_user_obj):
    mock_user_obj.is_verified = False
    mocker.patch("app.api.auth.get_user_by_email", return_value=mock_user_obj)
    mocker.patch("app.api.auth.verify_password", return_value=True)
    
    response = client.post("/auth/login", json={"email": "t@t.com", "password": "pw"})
    assert response.status_code == 403

def test_login_invalid_user(client, mocker):
    mocker.patch("app.api.auth.get_user_by_email", return_value=None)
    response = client.post("/auth/login", json={"email": "t@t.com", "password": "pw"})
    assert response.status_code == 401

def test_google_auth_not_configured(client, mocker):
    mocker.patch("app.api.auth.GOOGLE_CLIENT_ID", "")
    response = client.post("/auth/google", json={"id_token": "token"})
    assert response.status_code == 501

def test_get_current_user_dependency_failures(client):
    response = client.get("/auth/me")
    assert response.status_code == 401

def test_get_me(client, mock_user_obj):
    client.app.dependency_overrides[get_current_user] = lambda: mock_user_obj
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"

def test_change_password_google_account(client, mock_user_obj):
    mock_user_obj.provider = "google"
    client.app.dependency_overrides[get_current_verified_user] = lambda: mock_user_obj
    response = client.patch("/auth/me/password", json={"current_password": "old", "new_password": "newpass123"})
    assert response.status_code == 403

def test_change_password_invalid_current(client, mocker, mock_user_obj):
    client.app.dependency_overrides[get_current_verified_user] = lambda: mock_user_obj
    mocker.patch("app.api.auth.verify_password", return_value=False)
    response = client.patch("/auth/me/password", json={"current_password": "wrong", "new_password": "newpass123"})
    assert response.status_code == 401

def test_update_retention_invalid(client, mock_user_obj):
    client.app.dependency_overrides[get_current_verified_user] = lambda: mock_user_obj
    response = client.patch("/auth/me/retention", json={"data_retention_days": "invalid-value"})
    assert response.status_code == 422

def test_delete_account_gdpr(client, mocker, mock_user_obj):
    client.app.dependency_overrides[get_current_verified_user] = lambda: mock_user_obj
    mocker.patch("app.api.auth.delete_user_data")
    mocker.patch("app.services.vector_db.vector_service.client.delete")
    
    response = client.delete("/auth/me")
    assert response.status_code == 200

def test_google_auth_new_user(client, mocker, mock_user_obj):
    mocker.patch("app.api.auth.GOOGLE_CLIENT_ID", "dummy-id")
    mocker.patch("google.oauth2.id_token.verify_oauth2_token", return_value={
        "sub": "g-unique-123", "email": "google@user.com", "name": "Google User"
    })
    mocker.patch("google.auth.transport.requests.Request")
    
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    mocker.patch("app.api.auth.create_user", return_value=mock_user_obj)
    mocker.patch("app.api.auth.send_welcome_email")
    mocker.patch("app.api.auth.create_access_token", return_value="g-jwt")
    
    response = client.post("/auth/google", json={"id_token": "valid_token", "session_id": "sess-guest"})
    assert response.status_code == 200

def test_google_auth_link_existing_user(client, mocker, mock_user_obj):
    mocker.patch("app.api.auth.GOOGLE_CLIENT_ID", "dummy-id")
    mocker.patch("google.oauth2.id_token.verify_oauth2_token", return_value={
        "sub": "g-unique-123", "email": "google@user.com", "name": "Google User"
    })
    mocker.patch("google.auth.transport.requests.Request")
    
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    
    # Link an existing user who registered via email first
    mock_user_obj.google_id = None
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
    mocker.patch("app.api.auth.create_access_token", return_value="g-jwt")
    mocker.patch("app.services.database.claim_session_history")
    
    response = client.post("/auth/google", json={"id_token": "valid_token", "session_id": "sess-guest"})
    assert response.status_code == 200
    assert mock_user_obj.google_id == "g-unique-123"

def test_google_auth_existing_user_linked(client, mocker, mock_user_obj):
    """Test Google OAuth synchronization when an email record match exists but lacks google_id mapping."""
    mocker.patch("app.api.auth.GOOGLE_CLIENT_ID", "configured-client-id")
    mocker.patch("google.oauth2.id_token.verify_oauth2_token", return_value={
        "sub": "g-id-999", "email": "test@test.com", "name": "Test User"
    })
    mocker.patch("google.auth.transport.requests.Request")
    
    mock_db = MagicMock()
    mocker.patch("app.api.auth.SessionLocal", return_value=mock_db)
    
    # Simulate an account registered via standard email credentials that doesn't have a linked Google ID yet
    mock_user_obj.google_id = None 
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
    mocker.patch("app.api.auth.create_access_token", return_value="jwt")
    
    response = client.post("/auth/google", json={"id_token": "valid_token"})
    assert response.status_code == 200
    assert mock_user_obj.google_id == "g-id-999"
    