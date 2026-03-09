from app.agents.graph import app_instance
from langchain_core.messages import HumanMessage
from fastapi import FastAPI, UploadFile, File
from app.services.ingestor import process_pdf
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Veritas-Agent API")

# NEW: Allow the Frontend to talk to the Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/chat")
async def chat(query: str):
    inputs = {"messages": [HumanMessage(content=query)]}
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