import pytest
from unittest.mock import MagicMock
from app.core.security import hash_password
from app.api.auth import get_current_verified_user

def test_register_user_success(client, mocker):
    mocker.patch("app.api.auth.get_user_by_email", return_value=None)
    mocker.patch("app.api.auth.create_user", return_value=MagicMock(id="123"))
    mocker.patch("app.api.auth.send_verification_email")
    
    response = client.post("/auth/register", json={
        "email": "new@test.com", "name": "Test", "password": "password123"
    })
    assert response.status_code == 200

def test_verify_email_success(client, mocker, mock_db):
    mocker.patch("app.api.auth.decode_token", return_value={"sub": "123", "purpose": "verify_email"})
    user = MagicMock(id="123", email="test@test.com", is_verified=False)
    # Fix the 404 by ensuring the mock database returns our user object
    mock_db.query.return_value.filter.return_value.first.return_value = user
    mocker.patch("app.api.auth.send_welcome_email")
    mocker.patch("app.api.auth.create_access_token", return_value="fake-jwt")
    
    response = client.get("/auth/verify", params={"token": "valid"})
    assert response.status_code == 200
    assert user.is_verified is True

def test_login_success(client, mocker):
    user = MagicMock(id="123", email="t@t.com", password_hash=hash_password("pw"), is_verified=True)
    mocker.patch("app.api.auth.get_user_by_email", return_value=user)
    mocker.patch("app.api.auth.verify_password", return_value=True)
    mocker.patch("app.api.auth.create_access_token", return_value="fake-jwt")
    
    response = client.post("/auth/login", json={"email": "t@t.com", "password": "pw"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_delete_account_gdpr(client, mocker):
    user = MagicMock(id="123", is_verified=True)
    # Fix the 401 by correctly overriding the FastAPI dependency
    from app.main import app
    app.dependency_overrides[get_current_verified_user] = lambda: user
    
    mocker.patch("app.api.auth.delete_user_data")
    response = client.delete("/auth/me")
    assert response.status_code == 200