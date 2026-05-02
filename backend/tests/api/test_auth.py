def test_register_user_success(client, mocker):
    """Test successful user registration."""
    
    # 1. MOCK THE DATABASE FUNCTIONS used in auth.py
    # Pretend get_user_by_email returns None (user doesn't exist)
    mocker.patch("app.api.auth.get_user_by_email", return_value=None)
    
    # Pretend create_user successfully returns a dummy user object
    class DummyUser:
        id = "test-uuid-123"
    mocker.patch("app.api.auth.create_user", return_value=DummyUser())
    
    # 2. MOCK THE EMAIL: Prevent Resend from firing
    mock_send_email = mocker.patch("app.api.auth.send_verification_email")
    
    # 3. MAKE THE REQUEST
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "Password123!",
            "name": "Test User"
        }
    )
    
    # 4. ASSERTIONS
    assert response.status_code == 200
    assert response.json()["message"] == "Registration successful. Please check your email to verify your account."
    mock_send_email.assert_called_once()


def test_register_user_already_exists(client, mocker):
    """Test registration fails if email is taken."""
    
    # 1. MOCK THE DATABASE: Pretend the user ALREADY exists
    class TakenUser:
        id = "test-uuid-999"
        email = "taken@test.com"
        
    mocker.patch("app.api.auth.get_user_by_email", return_value=TakenUser())
    
    # 2. MAKE THE REQUEST
    response = client.post(
        "/auth/register",
        json={
            "email": "taken@test.com",
            "password": "Password123!",
            "name": "Taken User"
        }
    )
    
    # 3. ASSERTIONS
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"].lower()