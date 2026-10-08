from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CitationItem(BaseModel):
    chunk_id: str
    paper_id: int
    page_number: int
    section: Optional[str] = None
    snippet: str
    relevance_score: Optional[float] = None

class ChatSessionCreate(BaseModel):
    paper_id: Optional[int] = None
    title: Optional[str] = "New Conversation"

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    paper_id: Optional[int] = None
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    query: str = Field(..., min_length=1)
    agent_mode: Optional[str] = Field(default="research", description="research, summarizer, citation, or standard")

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    agent_used: Optional[str] = None
    citations: Optional[List[CitationItem]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]
