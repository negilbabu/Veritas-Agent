from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import datetime
import uuid

load_dotenv()
from dotenv import find_dotenv
print(f"--- LOADING ENV FROM: {find_dotenv()} ---")
#  Database Setup
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
db = os.getenv("POSTGRES_DB")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")

DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{db}"
engine = create_engine(DATABASE_URL)

Base = declarative_base()

class ChatMessage(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    title = Column(String, nullable=True)
    role = Column(String) # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def save_message(session_id: str, role: str, content: str, title: str = None):
    db = SessionLocal()
    msg = ChatMessage(session_id=session_id, role=role, content=content, title=title)
    db.add(msg)
    db.commit()
    db.close()

def get_history(session_id: str):
    db = SessionLocal()
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp).all()
    db.close()
    return messages