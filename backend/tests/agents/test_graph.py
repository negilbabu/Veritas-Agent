from unittest.mock import MagicMock
from app.agents.graph import research_router

def test_research_router_retrieve():
    # We mock the message content to trigger the 'retrieve' keywords
    state = {"messages": [MagicMock(content="Summarize the medical report")]}
    result = research_router(state)
    assert result == "retrieve"

def test_research_router_respond():
    # We mock a simple greeting to trigger the 'respond' path
    state = {"messages": [MagicMock(content="Hello there")]}
    result = research_router(state)
    assert result == "respond"