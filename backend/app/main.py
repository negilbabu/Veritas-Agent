import uuid
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, func

from app.services.database import init_db, save_message, get_history, SessionLocal, ChatMessage
from app.services.ingestor import process_pdf
from app.agents.graph import app_instance
from langchain_core.messages import HumanMessage

app = FastAPI(title="Veritas-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    session_id: Optional[str] = Form(None)
):
    # HANDSHAKE: Create session if it doesn't exist
    if not session_id or session_id in ["null", "undefined", ""]:
        session_id = str(uuid.uuid4())

    try:
        content = await file.read()
        # Process the PDF and tag it with the session_id
        num_chunks = process_pdf(content, file.filename, session_id) 
        
        return {
            "message": f"Successfully processed {file.filename}", 
            "session_id": session_id, 
            "chunks": num_chunks
        }
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat")
async def chat(query: str, session_id: Optional[str] = None):
    # 1. Handshake Logic
    is_new = False
    if not session_id or session_id in ["null", "undefined", ""]:
        session_id = str(uuid.uuid4())
        is_new = True
    
    save_message(session_id, "user", query)
    
    # 2. Agent Execution
    inputs = {"messages": [HumanMessage(content=query)], "session_id": session_id}
    config = {"configurable": {"thread_id": session_id}}
    
    try:
        result = await app_instance.ainvoke(inputs, config=config)
        response_text = result["messages"][-1].content
        sources = list(set(result.get("documents", [])))
        
        save_message(session_id, "assistant", response_text)
        
        return {
            "response": response_text,
            "session_id": session_id,
            "is_new_session": is_new,
            "sources": sources[:3]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions")
async def get_all_sessions():
    db = SessionLocal()
    try:
        results = db.query(ChatMessage.session_id).group_by(ChatMessage.session_id).order_by(desc(func.max(ChatMessage.timestamp))).all()
        return [r[0] for r in results]
    finally:
        db.close()

@app.get("/sessions/{session_id}/history")
async def fetch_history(session_id: str):
    history = get_history(session_id)
    return [{"role": m.role, "content": m.content} for m in history]

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    db = SessionLocal()
    try:
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        db.commit()
        return {"status": "success"}
    finally:
        db.close()