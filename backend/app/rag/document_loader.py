from pathlib import Path
from typing import Dict, Any, List
from app.rag.pdf_parser import PDFParser
from app.rag.text_splitter import RecursiveTextSplitter, DocumentChunk
from app.rag.vector_store import VectorStoreService, get_vector_store

class DocumentLoader:
    """End-to-end ingestion pipeline: reads file, extracts text, chunks, and indexes vectors."""

    def __init__(self, vector_store: VectorStoreService = None):
        self.vector_store = vector_store or get_vector_store()
        self.text_splitter = RecursiveTextSplitter(chunk_size=1000, chunk_overlap=200)

    def process_and_index_pdf(self, file_path: str | Path, paper_id: int) -> Dict[str, Any]:
        """Parse PDF, generate chunks, index in vector store, and return extracted metadata."""
        parser = PDFParser(file_path)
        extracted = parser.extract_document()

        # Split into semantic chunks
        chunks: List[DocumentChunk] = self.text_splitter.split_pages(
            pages=extracted["pages"],
            paper_id=paper_id
        )

        # Index in vector store
        indexed_count = self.vector_store.add_chunks(chunks)

        return {
            "metadata": extracted["metadata"],
            "total_pages": extracted["total_pages"],
            "total_chunks": indexed_count,
            "sample_abstract": extracted["metadata"].get("abstract", ""),
        }
