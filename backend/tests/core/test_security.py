from app.core.security import verify_password, hash_password, create_access_token, SECRET_KEY
from jose import jwt # Use jose to match your security.py implementation
import os

def test_password_hashing():
    """Test that a password hashes correctly and verifies successfully."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_create_access_token():
    """Test JWT token generation contains correct claims."""
    # 1. Use the actual SECRET_KEY from the app to avoid signature mismatches
    from app.core.security import ALGORITHM
    
    test_user_id = "user-123-uuid"
    test_email = "testuser@gmail.com"
    
    # 2. Generate the token
    token = create_access_token(user_id=test_user_id, email=test_email)
    
    # 3. Decode using the app's real key and algorithm
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    # 4. Assert all custom payload data is present
    assert decoded["sub"] == test_user_id
    assert decoded["email"] == test_email
    assert "exp" in decoded 
    assert "jti" in decoded