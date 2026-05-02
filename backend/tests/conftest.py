import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app

@pytest.fixture
def client():
    """Creates a standard test client and resets overrides after each test."""
    app.dependency_overrides = {}
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides = {}

@pytest.fixture
def mock_db():
    """Mocks the database SessionLocal and supports method chaining."""
    with patch("app.services.database.SessionLocal") as mock_session:
        session_instance = MagicMock()
        # Setup chaining: session.query().filter().first()
        session_instance.query.return_value.filter.return_value.first.return_value = None
        mock_session.return_value = session_instance
        yield session_instance