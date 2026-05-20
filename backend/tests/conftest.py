import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """Creates a test client and clears overrides after every test."""
    app.dependency_overrides = {}
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides = {}

@pytest.fixture
def mock_user_obj():
    """A helper fixture to create a dummy user for DB mocks."""
    from unittest.mock import MagicMock
    user = MagicMock()
    user.id = "user-123"
    user.email = "test@test.com"
    user.name = "Test User"
    user.is_verified = True
    user.password_hash = "hashed_bits"
    user.provider = "email"
    user.data_retention_days = "90"
    return user