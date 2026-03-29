import os
import time
import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Do NOT call load_dotenv() here — Docker injects env vars directly.
# load_dotenv() silently fails when .env is not present, but logs an
# empty path warning that is confusing. Docker handles env injection.

import logging
log = logging.getLogger("veritas")

# ── Database URL ──────────────────────────────────────────────────────────────
# Priority 1: DATABASE_URL env var (Supabase / cloud)
# Priority 2: Build from individual POSTGRES_* vars (local Docker)
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    log.info("--- DB: Using DATABASE_URL (cloud) ---")
else:
    log.info("--- DB: DATABASE_URL not set. Building from POSTGRES_* vars (local Docker) ---")
    user     = os.getenv("POSTGRES_USER",     "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgrespassword")
    db_name  = os.getenv("POSTGRES_DB",       "veritas_db")
    host     = os.getenv("POSTGRES_HOST",     "localhost")
    port     = os.getenv("POSTGRES_PORT",     "5432")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
Base   = declarative_base()


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id                  = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email               = Column(String, unique=True, index=True, nullable=False)
    name                = Column(String, nullable=True)
    password_hash       = Column(String, nullable=True)
    provider            = Column(String, default="email")   # "email" | "google"
    google_id           = Column(String, nullable=True, unique=True)
    is_verified         = Column(Boolean, default=False)
    data_retention_days = Column(String, default="90")      # "30"|"90"|"365"|"never"
    created_at          = Column(DateTime, default=datetime.datetime.utcnow)
    last_active         = Column(DateTime, default=datetime.datetime.utcnow,
                                 onupdate=datetime.datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_history"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    user_id    = Column(String, index=True, nullable=True)
    title      = Column(String, nullable=True)
    role       = Column(String)
    content    = Column(Text)
    timestamp  = Column(DateTime, default=datetime.datetime.utcnow)


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# ── Init ──────────────────────────────────────────────────────────────────────

def init_db():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            log.info("--- VERITAS DB: Tables synchronized successfully! ---")
            return
        except OperationalError as e:
            retries -= 1
            log.warning(f"--- DB CONNECTION PENDING ({retries} retries left): {e} ---")
            if retries == 0:
                raise e
            time.sleep(5)


# ── CRUD helpers ──────────────────────────────────────────────────────────────

def save_message(session_id: str, role: str, content: str,
                 title: str = None, user_id: str = None):
    db = SessionLocal()
    try:
        db.add(ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            title=title,
            user_id=user_id,
        ))
        db.commit()
    finally:
        db.close()


def get_history(session_id: str):
    db = SessionLocal()
    try:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp)
            .all()
        )
    finally:
        db.close()


def get_user_by_email(email: str):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def get_user_by_id(user_id: str):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()


def create_user(email: str, name: str, password_hash: str = None,
                provider: str = "email", google_id: str = None) -> User:
    db = SessionLocal()
    try:
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            provider=provider,
            google_id=google_id,
            is_verified=(provider == "google"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def delete_user_data(user_id: str):
    """GDPR Art.17 — deletes all messages and the user row."""
    db = SessionLocal()
    try:
        db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
        db.query(User).filter(User.id == user_id).delete()
        db.commit()
        log.info(f"[GDPR] Deleted all data for user {user_id}")
    finally:
        db.close()