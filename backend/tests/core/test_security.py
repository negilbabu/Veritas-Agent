import pytest
import os
from unittest.mock import patch, MagicMock
from app.core.security import verify_password, hash_password, create_access_token, decode_token

def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_create_and_decode_access_token():
    from app.core.security import SECRET_KEY, ALGORITHM
    
    test_user_id = "user-123-uuid"
    test_email = "testuser@gmail.com"
    
    token = create_access_token(user_id=test_user_id, email=test_email)
    decoded = decode_token(token)
    
    assert decoded is not None
    assert decoded["sub"] == test_user_id
    assert decoded["email"] == test_email
    assert "exp" in decoded 
    assert "jti" in decoded

def test_decode_token_invalid():
    # Passing an un-parsable text string ensures JWTError execution branches are covered
    assert decode_token("completely-invalid-token-string") is None