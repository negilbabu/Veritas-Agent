from fastapi import FastAPI
from app.agents.graph import app_instance
from langchain_core.messages import HumanMessage
from fastapi import UploadFile, File
from app.services.ingestor import process_pdf
app = FastAPI(title="Veritas-Agent API")

@app.get("/chat")
async def chat(query: str):
    # Initialize the state
    inputs = {"messages": [HumanMessage(content=query)]}
    
    # Run the Agentic Workflow
    result = await app_instance.ainvoke(inputs)
    
    return {"response": result["messages"][-1].content if "messages" in result else "Searching..."}

@app.get("/health")
def health():
    return {"status": "running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    num_chunks = process_pdf(content, file.filename)
    return {"message": f"Processed {file.filename}", "chunks": num_chunks}