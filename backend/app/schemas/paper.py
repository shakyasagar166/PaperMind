from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PaperBase(BaseModel):
    title: str = Field(..., max_length=512)
    authors: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None

class PaperUploadResponse(BaseModel):
    id: int
    title: str
    filename: str
    status: str
    total_pages: int
    created_at: datetime

    class Config:
        from_attributes = True

class PaperResponse(BaseModel):
    id: int
    user_id: int
    title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None
    filename: str
    status: str
    total_pages: int
    total_chunks: int
    summary_data: Optional[Dict[str, Any]] = None
    citation_bibtex: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaperSummaryRequest(BaseModel):
    mode: str = Field(default="comprehensive", description="comprehensive, executive, tldr, methodology")

class PaperSummaryResponse(BaseModel):
    paper_id: int
    mode: str
    executive_summary: Optional[str] = None
    key_contributions: Optional[List[str]] = None
    methodology: Optional[str] = None
    limitations: Optional[str] = None
    raw_content: Optional[str] = None
