from typing import List, Dict, Any, Optional
from app.rag.vector_store import VectorStoreService, get_vector_store
from app.schemas.chat import CitationItem

class RAGRetriever:
    """Orchestrates candidate retrieval, re-ranking, and context formatting for LLM prompts."""

    def __init__(self, vector_store: Optional[VectorStoreService] = None):
        self.vector_store = vector_store or get_vector_store()

    def retrieve(
        self,
        query: str,
        paper_id: Optional[int] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from the vector store."""
        return self.vector_store.similarity_search(query=query, paper_id=paper_id, top_k=top_k)

    def build_context(self, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into structured context block with page labels."""
        if not retrieved_chunks:
            return "No relevant excerpts found in the paper corpus."

        context_blocks = []
        for chunk in retrieved_chunks:
            meta = chunk.get("metadata", {})
            page_num = meta.get("page_number", "Unknown")
            chunk_id = chunk.get("chunk_id", "")
            score = chunk.get("score", 0.0)
            text = chunk.get("text", "").strip()

            header = f"[Source: Page {page_num} | Chunk ID: {chunk_id} | Similarity: {score}]"
            context_blocks.append(f"{header}\n{text}")

        return "\n\n---\n\n".join(context_blocks)

    def extract_citations(self, retrieved_chunks: List[Dict[str, Any]]) -> List[CitationItem]:
        """Convert raw retrieved chunks into structured CitationItem list."""
        citations: List[CitationItem] = []
        for chunk in retrieved_chunks:
            meta = chunk.get("metadata", {})
            citations.append(CitationItem(
                chunk_id=chunk.get("chunk_id", ""),
                paper_id=meta.get("paper_id", 0),
                page_number=meta.get("page_number", 1),
                snippet=chunk.get("text", "")[:200] + "...",
                relevance_score=chunk.get("score")
            ))
        return citations

_retriever: Optional[RAGRetriever] = None

def get_retriever() -> RAGRetriever:
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever
