from typing import Annotated, List, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[BaseMessage], add_messages]
    # Whether the retrieved documents are relevant
    is_relevant: bool
    # The actual documents retrieved from Qdrant
    documents: List[str]