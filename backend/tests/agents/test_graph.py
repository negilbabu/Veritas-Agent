import pytest
from unittest.mock import MagicMock
from app.agents.graph import research_router

def test_research_router_retrieve_basic():
    state = {"messages": [MagicMock(content="Summarize the medical report")]}
    assert research_router(state) == "retrieve"

def test_research_router_respond_basic():
    state = {"messages": [MagicMock(content="Hello there")]}
    assert research_router(state) == "respond"