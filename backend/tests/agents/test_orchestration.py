import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import AIMessage
from app.agents.graph import research_router, app_instance, retrieve_documents, generate_answer, simple_respond

def test_research_router_respond_path():
    """Verify router selects standard greeting text execution lines."""
    mock_msg = MagicMock(content="Thank you, assistant!")
    state = {"messages": [mock_msg]}
    assert research_router(state) == "respond"

def test_research_router_retrieve_keywords_path():
    """Verify context lookups are flagged via keyword triggers."""
    keywords = ["summarize", "clinical", "report", "patient", "data", "history", "diagnose"]
    for word in keywords:
        mock_msg = MagicMock(content=f"Can you please {word} this document contents?")
        state = {"messages": [mock_msg]}
        assert research_router(state) == "retrieve"

def test_graph_instance_bound():
    """Confirm compiled graph structures load flawlessly into the app context layer."""
    assert app_instance is not None

@patch("app.agents.graph.vector_service.search")
def test_retrieve_documents_node(mock_search):
    """Test node extracting data matrices via the vector pipeline wrapper."""
    mock_hit = MagicMock()
    mock_hit.payload = {"text": "Extracted clinical diagnostic evidence context.", "source": "notes.pdf"}
    mock_search.return_value = [mock_hit]
    
    state = {"messages": [MagicMock(content="patient query")], "session_id": "sess-123", "documents": []}
    result = retrieve_documents(state)
    
    assert "documents" in result
    assert len(result["documents"]) == 1
    assert result["documents"][0] == "Extracted clinical diagnostic evidence context."

@patch("app.agents.graph.llm")
def test_generate_answer_node(mock_llm):
    """Test generate_answer node execution by safely patching the module-level LLM instance."""
    mock_llm.invoke.return_value = AIMessage(content="Evidence-based answer payload.")
    
    state = {"messages": [MagicMock(content="query")], "documents": ["source context text"]}
    result = generate_answer(state)
    
    assert "messages" in result
    assert result["messages"][0].content == "Evidence-based answer payload."

@patch("app.agents.graph.llm")
def test_simple_respond_node(mock_llm):
    """Test non-search casual response node pipeline path execution."""
    mock_llm.invoke.return_value = AIMessage(content="Hello! I am Veritas AI.")
    
    state = {"messages": [MagicMock(content="Hello")]}
    result = simple_respond(state)
    
    assert "messages" in result
    assert result["messages"][0].content == "Hello! I am Veritas AI."