import os
import uuid
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
import logging
import sys
from app.services.database import init_db, save_message, get_history, SessionLocal, ChatMessage
from app.services.ingestor import process_pdf
from app.agents.graph import app_instance
from langchain_core.messages import HumanMessage, SystemMessage
from app.utils import log

app = FastAPI(title="Veritas-Agent API")

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()


# ── Title generation ─────────────────────────────────────────────────────────
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


# ── /upload ───────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
):
    if not session_id or session_id in ["null", "undefined", ""]:
        session_id = str(uuid.uuid4())

    try:
        content = await file.read()
        num_chunks = process_pdf(content, file.filename, session_id)

        chat_title = await generate_chat_title(file.filename, source="file")

        save_message(session_id, "system",
                     f"📎 Document analyzed: {file.filename}", title=chat_title)

        greeting = (
            f"I have successfully indexed **{file.filename}**. "
            "I'm ready to assist with clinical consulting or specific data extraction "
            "from this document. What would you like to know, Sir?"
        )
        save_message(session_id, "assistant", greeting, title=chat_title)

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
async def chat(query: str, session_id: Optional[str] = None):
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

    save_message(session_id, "user", query, title=chat_title)

    inputs = {"messages": [HumanMessage(content=query)], "session_id": session_id}
    config = {"configurable": {"thread_id": session_id}}

    try:
        result = await app_instance.ainvoke(inputs, config=config)
        response_text = result["messages"][-1].content
        sources = list(set(result.get("documents", [])))

        save_message(session_id, "assistant", response_text, title=chat_title)

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


# ── /sessions ─────────────────────────────────────────────────────────────────
# FIX: Use a subquery to get the LATEST title per session, avoiding duplicates
# caused by mixing .distinct() and .group_by() with multiple title values.
@app.get("/sessions")
async def get_all_sessions():
    db = SessionLocal()
    try:
        # Subquery: for each session, get the row with the most recent timestamp
        from sqlalchemy import func
        latest_ts = (
            db.query(
                ChatMessage.session_id,
                func.max(ChatMessage.timestamp).label("max_ts"),
            )
            .group_by(ChatMessage.session_id)
            .subquery()
        )

        # Join back to get the title from that latest row
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

        # Deduplicate by session_id preserving order (safety net)
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
async def fetch_history(session_id: str):
    history = get_history(session_id)
    return [{"role": m.role, "content": m.content} for m in history]


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    db = SessionLocal()
    try:
        db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).delete()
        db.commit()
        return {"status": "success"}
    finally:
        db.close()