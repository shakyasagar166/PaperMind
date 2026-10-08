from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.paper import Paper
from app.agents.summarizer_agent import get_summarizer_agent
from app.agents.citation_agent import get_citation_agent
from app.schemas.paper import PaperSummaryResponse

class SummaryService:
    def __init__(self, db: Session):
        self.db = db
        self.summarizer_agent = get_summarizer_agent()
        self.citation_agent = get_citation_agent()

    async def get_or_generate_summary(self, paper_id: int, user_id: int, mode: str = "comprehensive") -> PaperSummaryResponse:
        """Fetch cached summary or generate on-demand using SummarizerAgent."""
        paper = self.db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
        if not paper:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

        # Check existing cached summary
        if paper.summary_data and paper.summary_data.get("mode") == mode:
            data = paper.summary_data
            return PaperSummaryResponse(
                paper_id=paper.id,
                mode=mode,
                executive_summary=data.get("executive_summary"),
                key_contributions=data.get("key_contributions"),
                methodology=data.get("methodology"),
                limitations=data.get("limitations"),
                raw_content=data.get("raw_content")
            )

        # Generate summary
        result = await self.summarizer_agent.summarize_paper(
            paper_id=paper.id,
            paper_title=paper.title,
            abstract=paper.abstract or "",
            mode=mode
        )

        # Cache in paper record
        paper.summary_data = result
        self.db.commit()

        return PaperSummaryResponse(
            paper_id=paper.id,
            mode=mode,
            executive_summary=result.get("executive_summary"),
            key_contributions=result.get("key_contributions"),
            methodology=result.get("methodology"),
            limitations=result.get("limitations"),
            raw_content=result.get("raw_content")
        )

    def get_citations(self, paper_id: int, user_id: int, format_type: str = "bibtex") -> dict:
        """Generate citations for a specific paper."""
        paper = self.db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
        if not paper:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

        all_cites = self.citation_agent.format_all(
            title=paper.title,
            authors=paper.authors,
            year=paper.year
        )
        return {
            "format": format_type,
            "citation": all_cites.get(format_type.lower(), all_cites["bibtex"]),
            "all_formats": all_cites
        }
