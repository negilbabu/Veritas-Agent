import os
import uuid
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import desc, func

from app.services.database import (
    init_db, save_message, get_history,
    SessionLocal, ChatMessage, get_user_by_id
)
from app.services.ingestor import process_pdf
from app.agents.graph import app_instance
from app.api.auth import router as auth_router, get_current_user
from app.core.security import decode_token
from langchain_core.messages import HumanMessage, SystemMessage
from app.utils import log

app = FastAPI(title="Veritas-Agent API")

# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in allowed_origins_raw.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth router ───────────────────────────────────────────────────────────────
app.include_router(auth_router)

bearer = HTTPBearer(auto_error=False)


@app.on_event("startup")
def startup_event():
    init_db()


# ── Optional auth: returns user_id if token present, else None (guest) ────────
def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> Optional[str]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("purpose"):
        return None
    return payload.get("sub")


# ── Title generation ──────────────────────────────────────────────────────────
async def generate_chat_title(text: str, source: str = "query") -> str:
    try:
        if source == "file":
            prompt = (
                f"A user uploaded a PDF file named '{text}'. "
                "Write a concise 4-6 word chat title that describes this session. "
                "Reply with ONLY the title — no quotes, no punctuation at the end."
            )
        else:
            prompt = (
                f"A user started a chat with this message: \"{text}\". "
                "Write a concise 4-6 word chat title that captures the topic. "
                "Reply with ONLY the title — no quotes, no punctuation at the end."
            )
        result = await app_instance.ainvoke(
            {
                "messages": [
                    SystemMessage(content="You are a helpful assistant that only outputs short chat titles."),
                    HumanMessage(content=prompt),
                ],
                "session_id": "title-gen",
            },
            config={"configurable": {"thread_id": f"title-{uuid.uuid4()}"}},
        )
        title = result["messages"][-1].content.strip().strip('"').strip("'")
        return title[:50] if title else _fallback_title(text)
    except Exception as e:
        log.info(f"[title-gen] LLM call failed: {e}")
        return _fallback_title(text)


def _fallback_title(text: str) -> str:
    clean = text.replace("_", " ").replace("-", " ")
    if clean.lower().endswith(".pdf"):
        clean = clean[:-4]
    return (clean[:30] + "…") if len(clean) > 30 else clean

# ── /health check (render) ───────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Dedicated health check endpoint for monitoring uptime.
    """
    return {"status": "ok", "message": "Server is up and running"}

# ── /upload ───────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    # Guest users must provide a session_id from the client
    if not session_id or session_id in ["null", "undefined", ""]:
        session_id = str(uuid.uuid4())

    try:
        content = await file.read()
        # Pass user_id to ingestor so vectors are tagged for GDPR deletion
        num_chunks = process_pdf(content, file.filename, session_id, user_id=user_id)
        chat_title = await generate_chat_title(file.filename, source="file")

        save_message(session_id, "system",
                     f"📎 Document analyzed: {file.filename}",
                     title=chat_title, user_id=user_id)

        greeting = (
            f"I have successfully indexed **{file.filename}**. "
            "I'm ready to assist with clinical consulting or specific data extraction "
            "from this document. What would you like to know, Sir?"
        )
        save_message(session_id, "assistant", greeting,
                     title=chat_title, user_id=user_id)

        return {
            "message": f"Processed {file.filename}",
            "session_id": session_id,
            "chat_title": chat_title,
            "assistant_greeting": greeting,
        }
    except Exception as e:
        log.info(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── /chat ─────────────────────────────────────────────────────────────────────
@app.get("/chat")
async def chat(
    query: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    is_new_session = False

    if not session_id or session_id in ["null", "undefined", ""]:
        session_id = str(uuid.uuid4())
        is_new_session = True
        chat_title = await generate_chat_title(query, source="query")
    else:
        db = SessionLocal()
        first_msg = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).first()
        chat_title = (
            first_msg.title
            if (first_msg and first_msg.title)
            else await generate_chat_title(query, source="query")
        )
        db.close()

    save_message(session_id, "user", query,
                 title=chat_title, user_id=user_id)

    inputs  = {"messages": [HumanMessage(content=query)], "session_id": session_id}
    config  = {"configurable": {"thread_id": session_id}}

    try:
        result        = await app_instance.ainvoke(inputs, config=config)
        response_text = result["messages"][-1].content
        sources       = list(set(result.get("documents", [])))

        save_message(session_id, "assistant", response_text,
                     title=chat_title, user_id=user_id)

        return {
            "response": response_text,
            "sources": sources[:3],
            "session_id": session_id,
            "chat_title": chat_title,
            "is_new_session": is_new_session,
        }
    except Exception as e:
        log.info(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Agent Error")


# ── /sessions — registered users only see their own sessions ──────────────────
@app.get("/sessions")
async def get_all_sessions(
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    """
    Registered users: returns only their sessions (scoped by user_id).
    Guest users (no token): returns empty list — history is client-side only.
    """
    if not user_id:
        return []  # Guests have no server-side history

    db = SessionLocal()
    try:
        latest_ts = (
            db.query(
                ChatMessage.session_id,
                func.max(ChatMessage.timestamp).label("max_ts"),
            )
            .filter(ChatMessage.user_id == user_id)
            .group_by(ChatMessage.session_id)
            .subquery()
        )

        results = (
            db.query(ChatMessage.session_id, ChatMessage.title, ChatMessage.timestamp)
            .join(
                latest_ts,
                (ChatMessage.session_id == latest_ts.c.session_id)
                & (ChatMessage.timestamp == latest_ts.c.max_ts),
            )
            .order_by(desc(ChatMessage.timestamp))
            .all()
        )

        seen: set = set()
        sessions = []
        for r in results:
            if r.session_id not in seen:
                seen.add(r.session_id)
                sessions.append({"id": r.session_id, "title": r.title or "New Chat"})
        return sessions
    finally:
        db.close()


@app.get("/sessions/{session_id}/history")
async def fetch_history(
    session_id: str,
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    history = get_history(session_id)
    # Security: ensure registered users can only read their own sessions
    if user_id and history:
        if history[0].user_id and history[0].user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return [{"role": m.role, "content": m.content} for m in history]


@app.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    db = SessionLocal()
    try:
        q = db.query(ChatMessage).filter(ChatMessage.session_id == session_id)
        if user_id:
            q = q.filter(ChatMessage.user_id == user_id)
        q.delete()
        db.commit()

        # Also delete Qdrant vectors for this session
        try:
            from qdrant_client.http import models as qmodels
            from app.services.vector_db import vector_service
            vector_service.client.delete(
                collection_name=vector_service.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[qmodels.FieldCondition(
                            key="session_id",
                            match=qmodels.MatchValue(value=session_id)
                        )]
                    )
                )
            )
        except Exception as e:
            log.warning(f"[delete_session] Qdrant cleanup failed: {e}")

        return {"status": "success"}
    finally:
        db.close()