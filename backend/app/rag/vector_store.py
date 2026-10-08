import os
import math
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.rag.text_splitter import DocumentChunk
from app.rag.embeddings import EmbeddingService, get_embedding_service

logger = logging.getLogger("papermind.vector_store")

class VectorStoreService:
    """Manages document vector indexing, persistence, and semantic similarity search."""

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        self.embedding_service = embedding_service or get_embedding_service()
        self._chroma_client = None
        self._collection = None
        self._in_memory_docs: List[Dict[str, Any]] = []

        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            self._chroma_client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self._collection = self._chroma_client.get_or_create_collection(
                name="papermind_corpus",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB persistent collection initialized successfully.")
        except Exception as e:
            logger.warning(f"ChromaDB initialization failed: {e}. Utilizing in-memory vector store fallback.")

    def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """Embed and insert document chunks into vector index."""
        if not chunks:
            return 0

        texts = [chunk.text for chunk in chunks]
        embeddings = self.embedding_service.embed_texts(texts)
        ids = [chunk.chunk_id for chunk in chunks]
        metadatas = [
            {
                "paper_id": chunk.paper_id,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
            }
            for chunk in chunks
        ]

        if self._collection is not None:
            try:
                self._collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
                return len(chunks)
            except Exception as e:
                logger.error(f"Error adding chunks to Chroma: {e}")

        # In-memory store fallback
        for chunk, emb in zip(chunks, embeddings):
            self._in_memory_docs.append({
                "id": chunk.chunk_id,
                "embedding": emb,
                "text": chunk.text,
                "metadata": {
                    "paper_id": chunk.paper_id,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                }
            })
        return len(chunks)

    def similarity_search(
        self,
        query: str,
        paper_id: Optional[int] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Query vector database for most semantically relevant chunks."""
        query_vector = self.embedding_service.embed_query(query)

        if self._collection is not None:
            try:
                where_filter = {"paper_id": paper_id} if paper_id is not None else None
                results = self._collection.query(
                    query_embeddings=[query_vector],
                    n_results=top_k,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )
                formatted = []
                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                dists = results.get("distances", [[]])[0]
                ids = results.get("ids", [[]])[0]

                for i in range(len(docs)):
                    # Cosine distance to similarity conversion: 1.0 - distance
                    sim = 1.0 - dists[i] if i < len(dists) else 0.0
                    formatted.append({
                        "chunk_id": ids[i],
                        "text": docs[i],
                        "metadata": metas[i],
                        "score": round(float(sim), 4)
                    })
                return formatted
            except Exception as e:
                logger.error(f"ChromaDB search failed: {e}. Falling back to in-memory search.")

        # In-memory cosine similarity search
        candidates = self._in_memory_docs
        if paper_id is not None:
            candidates = [d for d in candidates if d["metadata"].get("paper_id") == paper_id]

        scored = []
        for doc in candidates:
            sim = self._cosine_similarity(query_vector, doc["embedding"])
            scored.append({
                "chunk_id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
                "score": round(float(sim), 4)
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def delete_paper_vectors(self, paper_id: int) -> None:
        """Purge all chunks associated with a specific paper."""
        if self._collection is not None:
            try:
                self._collection.delete(where={"paper_id": paper_id})
            except Exception as e:
                logger.warning(f"ChromaDB delete failed: {e}")

        self._in_memory_docs = [
            d for d in self._in_memory_docs if d["metadata"].get("paper_id") != paper_id
        ]

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two unit vectors."""
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        return dot

_vector_store: Optional[VectorStoreService] = None

def get_vector_store() -> VectorStoreService:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService()
    return _vector_store
