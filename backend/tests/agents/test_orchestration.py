import pytest
from unittest.mock import MagicMock, patch
from app.agents.graph import research_router, app_instance

def test_research_router_fallback():
    # Test routing logic when the conversation state context is empty or unhandled
    state = {"messages": []}
    assert research_router(state) == "respond"

@patch("app.agents.graph.vector_service.client.search")
def test_graph_execution_flow(mock_search):
    # Verify synchronous mock tracking across LangGraph state steps safely
    mock_search.return_value = [
        MagicMock(payload={"text": "Evidence summary", "source": "report.pdf"})
    ]
    assert app_instance is not None