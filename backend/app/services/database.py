import os
import time
import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv, find_dotenv
from app.main.logging import log

# 1. Load Environment Variables
load_dotenv()
log.info(f"--- LOADING ENV FROM: {find_dotenv()} ---")

# 2. Database URL Logic
# Priority 1: Use DATABASE_URL (for Supabase/Cloud)
# Priority 2: Build from components (for Local Docker)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    log.info("\n--- INFO: DATABASE_URL not found. Using local container config. ---")
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgrespassword")
    db = os.getenv("POSTGRES_DB", "veritas_db")
    host = os.getenv("POSTGRES_HOST", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{db}"
else:
    log.info("\n--- SUCCESS: Found DATABASE_URL. Connecting to Cloud Database. ---")

# 3. Engine Configuration
# Added 'pool_pre_ping' to ensure we don't use "stale" cloud connections
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,
    pool_recycle=3600
)

Base = declarative_base()

# 4. Data Models
class ChatMessage(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    title = Column(String, nullable=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# 5. Initialization with Retry Logic
def init_db():
    """Tries to connect and sync tables. Retries 5 times if connection fails."""
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            log.info("--- VERITAS DB: Tables synchronized successfully! ---")
            return
        except OperationalError as e:
            retries -= 1
            log.info(f"--- DATABASE CONNECTION PENDING: {e} ---")
            if retries == 0:
                log.info("--- CRITICAL ERROR: Could not connect to Supabase. ---")
                raise e
            log.info(f"--- Retrying in 5 seconds... ({retries} attempts left) ---")
            time.sleep(5)

# 6. Database Operations
def save_message(session_id: str, role: str, content: str, title: str = None):
    db = SessionLocal()
    try:
        msg = ChatMessage(session_id=session_id, role=role, content=content, title=title)
        db.add(msg)
        db.commit()
    finally:
        db.close()

def get_history(session_id: str):
    db = SessionLocal()
    try:
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp)
            .all()
        )
        return messages
    finally:
        db.close()