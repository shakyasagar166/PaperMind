from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(512), nullable=False, default="Untitled Paper")
    authors = Column(String(512), nullable=True, default="")
    year = Column(Integer, nullable=True)
    abstract = Column(Text, nullable=True, default="")
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    status = Column(String(50), default="processing")  # "processing", "ready", "failed"
    total_pages = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    summary_data = Column(JSON, nullable=True)  # stores structured summaries
    citation_bibtex = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    owner = relationship("User", back_populates="papers")
    chat_sessions = relationship("ChatSession", back_populates="paper", cascade="all, delete-orphan")
