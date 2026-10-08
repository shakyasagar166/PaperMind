import shutil
import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.models.paper import Paper
from app.rag.document_loader import DocumentLoader
from app.rag.vector_store import get_vector_store
from app.agents.citation_agent import get_citation_agent

logger = logging.getLogger("papermind.services.paper")

class PaperService:
    def __init__(self, db: Session):
        self.db = db
        self.document_loader = DocumentLoader()
        self.vector_store = get_vector_store()
        self.citation_agent = get_citation_agent()

    def get_papers(self, user_id: int, skip: int = 0, limit: int = 20, search: Optional[str] = None) -> List[Paper]:
        """Fetch papers belonging to user with optional keyword filtering."""
        query = self.db.query(Paper).filter(Paper.user_id == user_id)
        if search:
            query = query.filter(Paper.title.ilike(f"%{search}%") | Paper.abstract.ilike(f"%{search}%"))
        return query.order_by(Paper.created_at.desc()).offset(skip).limit(limit).all()

    def get_paper(self, paper_id: int, user_id: int) -> Paper:
        """Fetch single paper by ID, validating ownership."""
        paper = self.db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()
        if not paper:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
        return paper

    def process_uploaded_paper(self, file: UploadFile, user_id: int) -> Paper:
        """Save PDF, create database entry, parse, chunk and vector index the document."""
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF documents are supported."
            )

        # 1. Create initial DB record
        initial_title = Path(file.filename).stem.replace("_", " ").title()
        paper = Paper(
            user_id=user_id,
            title=initial_title,
            filename=file.filename,
            file_path="",
            status="processing"
        )
        self.db.add(paper)
        self.db.commit()
        self.db.refresh(paper)

        # 2. Persist PDF to local storage
        stored_filename = f"user_{user_id}_paper_{paper.id}.pdf"
        target_path = settings.PAPERS_DIR / stored_filename

        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            paper.file_path = str(target_path)
            self.db.commit()

            # 3. Ingestion & RAG Indexing
            ingest_result = self.document_loader.process_and_index_pdf(
                file_path=target_path,
                paper_id=paper.id
            )

            meta = ingest_result.get("metadata", {})
            if meta.get("title") and len(meta["title"].strip()) > 3:
                paper.title = meta["title"]
            if meta.get("authors"):
                paper.authors = meta["authors"]
            if meta.get("year"):
                paper.year = meta["year"]
            if meta.get("abstract"):
                paper.abstract = meta["abstract"]

            paper.total_pages = ingest_result.get("total_pages", 1)
            paper.total_chunks = ingest_result.get("total_chunks", 0)
            paper.citation_bibtex = self.citation_agent.generate_bibtex(
                title=paper.title,
                authors=paper.authors,
                year=paper.year
            )
            paper.status = "ready"
            self.db.commit()
            self.db.refresh(paper)
            return paper

        except Exception as e:
            logger.error(f"Error processing paper {paper.id}: {e}")
            paper.status = "failed"
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process and index PDF: {str(e)}"
            )

    def delete_paper(self, paper_id: int, user_id: int) -> None:
        """Remove paper from database, delete disk file, and purge vectors."""
        paper = self.get_paper(paper_id=paper_id, user_id=user_id)

        # Remove vector store records
        self.vector_store.delete_paper_vectors(paper_id)

        # Remove PDF file on disk
        if paper.file_path:
            file_path = Path(paper.file_path)
            if file_path.exists():
                file_path.unlink()

        self.db.delete(paper)
        self.db.commit()
