from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.paper import PaperResponse, PaperUpdate, PaperUploadResponse
from app.services.paper_service import PaperService
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/papers", tags=["Papers"])

@router.post("/upload", response_model=PaperUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_paper(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload research paper in PDF format, parse sections, and index in vector store."""
    service = PaperService(db)
    paper = service.process_uploaded_paper(file=file, user_id=current_user.id)
    return paper

@router.get("", response_model=List[PaperResponse])
def list_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve catalog of uploaded papers for current user."""
    service = PaperService(db)
    return service.get_papers(user_id=current_user.id, skip=skip, limit=limit, search=search)

@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get metadata and processing details for a specific paper."""
    service = PaperService(db)
    return service.get_paper(paper_id=paper_id, user_id=current_user.id)

@router.put("/{paper_id}", response_model=PaperResponse)
def update_paper(
    paper_id: int,
    paper_update: PaperUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update title, authors, or abstract for a paper."""
    service = PaperService(db)
    paper = service.get_paper(paper_id=paper_id, user_id=current_user.id)

    if paper_update.title is not None:
        paper.title = paper_update.title
    if paper_update.authors is not None:
        paper.authors = paper_update.authors
    if paper_update.year is not None:
        paper.year = paper_update.year
    if paper_update.abstract is not None:
        paper.abstract = paper_update.abstract

    db.commit()
    db.refresh(paper)
    return paper

@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a paper, its local PDF storage, and all indexed vector embeddings."""
    service = PaperService(db)
    service.delete_paper(paper_id=paper_id, user_id=current_user.id)
    return None

@router.get("/{paper_id}/download")
def download_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download the raw PDF document."""
    service = PaperService(db)
    paper = service.get_paper(paper_id=paper_id, user_id=current_user.id)
    return FileResponse(
        path=paper.file_path,
        media_type="application/pdf",
        filename=paper.filename
    )
