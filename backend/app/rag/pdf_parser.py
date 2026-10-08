import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

class PDFParser:
    """Extracts text, metadata, page structures, and sections from PDF documents."""

    def __init__(self, file_path: str | Path):
        self.file_path = Path(file_path)

    def extract_document(self) -> Dict[str, Any]:
        """Extract all pages, metadata, and inferred structural information."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"PDF file not found at {self.file_path}")

        reader = PdfReader(str(self.file_path))
        total_pages = len(reader.pages)
        pages_content: List[Dict[str, Any]] = []

        full_text_list = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            # Clean excessive whitespace and carriage returns
            clean_text = self._clean_text(page_text)
            full_text_list.append(clean_text)
            pages_content.append({
                "page_number": index + 1,
                "text": clean_text,
                "char_count": len(clean_text)
            })

        full_raw_text = "\n\n".join(full_text_list)
        metadata = self._extract_metadata(reader, pages_content)

        return {
            "total_pages": total_pages,
            "metadata": metadata,
            "pages": pages_content,
            "full_text": full_raw_text
        }

    def _clean_text(self, text: str) -> str:
        """Normalize line breaks and clean whitespace."""
        text = re.sub(r'\r\n|\r', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def _extract_metadata(self, reader: PdfReader, pages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract or infer title, authors, year, and abstract."""
        pdf_meta = reader.metadata or {}
        first_page_text = pages[0]["text"] if pages else ""

        # Inferred Title
        title = pdf_meta.title
        if not title or len(title.strip()) < 4:
            # Infer from first non-empty lines of first page
            lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
            title = lines[0] if lines else self.file_path.stem

        # Inferred Abstract
        abstract = ""
        abstract_match = re.search(r'(?i)\babstract\b[:\s]*(.+?)(?=\n\s*(?:1[\.\s]|introduction|keywords|index terms))', first_page_text, re.DOTALL)
        if abstract_match:
            abstract = abstract_match.group(1).strip()
        elif len(pages) > 0 and len(first_page_text) > 200:
            abstract = first_page_text[:400] + "..."

        # Inferred Authors
        authors = pdf_meta.author or ""
        if not authors and len(first_page_text.split('\n')) > 2:
            lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
            if len(lines) > 1:
                authors = lines[1]

        # Year inference
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', first_page_text)
        year = int(year_match.group(1)) if year_match else None

        return {
            "title": str(title).strip(),
            "authors": str(authors).strip(),
            "year": year,
            "abstract": abstract.strip()
        }
