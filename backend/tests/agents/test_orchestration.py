import pytest
from unittest.mock import MagicMock, patch
from app.agents.graph import research_router, app_instance

def test_research_router_respond_path():
    mock_msg = MagicMock(content="Thank you, assistant!")
    state = {"messages": [mock_msg]}
    assert research_router(state) == "respond"

def test_research_router_retrieve_keywords_path():
    keywords = ["summarize", "clinical", "report", "patient", "data", "history", "diagnose"]
    for word in keywords:
        mock_msg = MagicMock(content=f"Can you please {word} this document contents?")
        state = {"messages": [mock_msg]}
        assert research_router(state) == "retrieve"

def test_graph_state_compile_validation():
    assert app_instance is not None