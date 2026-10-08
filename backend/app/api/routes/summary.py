from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.paper import PaperSummaryRequest, PaperSummaryResponse
from app.services.summary_service import SummaryService
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/summary", tags=["Summaries & Citations"])

@router.post("/{paper_id}", response_model=PaperSummaryResponse)
async def generate_summary(
    paper_id: int,
    request: PaperSummaryRequest = PaperSummaryRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or retrieve a structured multi-perspective summary of the paper."""
    service = SummaryService(db)
    return await service.get_or_generate_summary(
        paper_id=paper_id,
        user_id=current_user.id,
        mode=request.mode
    )

@router.get("/{paper_id}/citations")
def get_paper_citations(
    paper_id: int,
    format_type: str = Query("bibtex", description="bibtex, apa, ieee"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve bibliographic citations formatted in BibTeX, APA, or IEEE."""
    service = SummaryService(db)
    return service.get_citations(
        paper_id=paper_id,
        user_id=current_user.id,
        format_type=format_type
    )
