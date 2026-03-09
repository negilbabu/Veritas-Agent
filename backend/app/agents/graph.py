import os
from langgraph.graph import StateGraph, END
from .state import AgentState
from app.services.vector_db import vector_service
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Point ChatOpenAI to Groq's API endpoint
llm = ChatOpenAI(
    openai_api_base="https://api.groq.com/openai/v1",
    openai_api_key=os.getenv("GROQ_API_KEY"),         
    model_name="llama-3.3-70b-versatile"             
)

# 1. Router Logic
def research_router(state: AgentState):
    user_query = state["messages"][-1].content.lower()
    # If they ask a question, we should almost always retrieve context
    if any(word in user_query for word in ["find", "document", "report", "law", "medical", "treatment", "what", "how"]):
        return "retrieve"
    return "respond"

# 2. Real Retrieval Node
def retrieve_documents(state: AgentState):
    print("---QUERYING REAL QDRANT DB---")
    user_query = state["messages"][-1].content
    
    # Use the REAL search that embeds the query text
    hits = vector_service.search(user_query) 
    
    is_relevant = len(hits) > 0
    # Extract text from the payload of each hit
    documents = [hit.payload.get("text", "") for hit in hits]
    
    return {"documents": documents, "is_relevant": is_relevant}

# 3. Respond Node (For non-search queries like "Hello")
def simple_respond(state: AgentState):
    user_query = state["messages"][-1].content
    response = llm.invoke([HumanMessage(content=user_query)])
    return {"messages": [response]}

# 4. Generate Answer Node
def generate_answer(state: AgentState):
    context = "\n".join(state["documents"])
    user_query = state["messages"][-1].content
    
    system_prompt = f"""
    You are Veritas-Agent, a professional medical assistant. 
    Use the following context from the uploaded PDF to answer the query accurately.
    If the context doesn't contain the answer, say you don't know based on the documents.
    
    CONTEXT:
    {context}
    """
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_query)
    ])
    
    return {"messages": [response]}

# 5. Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("retrieve", retrieve_documents)
workflow.add_node("generate", generate_answer)
workflow.add_node("respond", simple_respond)

# Entry logic
workflow.set_conditional_entry_point(
    research_router,
    {
        "retrieve": "retrieve",
        "respond": "respond"
    }
)

# Standard Edges
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)
workflow.add_edge("respond", END)

app_instance = workflow.compile()