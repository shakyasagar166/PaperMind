import os
import math
import hashlib
import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("papermind.embeddings")

class EmbeddingService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        dimension: Optional[int] = None
    ):
        self.api_key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        self.model = model or settings.EMBEDDING_MODEL
        self.dimension = dimension or settings.EMBEDDING_DIMENSION
        self._client = None

        if self.api_key:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI embedding client: {e}")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a batch of strings."""
        if not texts:
            return []

        if self._client:
            try:
                response = self._client.embeddings.create(
                    model=self.model,
                    input=texts
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                logger.error(f"OpenAI embedding call failed: {e}. Falling back to deterministic vector embedding.")

        # Deterministic offline embedding generation for local dev/testing
        return [self._offline_deterministic_embedding(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        """Embed a single search query."""
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self.dimension

    def _offline_deterministic_embedding(self, text: str) -> List[float]:
        """Generate normalized deterministic pseudo-embedding based on text tokens/hashes."""
        vector = [0.0] * self.dimension
        words = text.lower().split()
        if not words:
            return vector

        for i, word in enumerate(words):
            hash_val = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = hash_val % self.dimension
            vector[idx] += 1.0 / (1.0 + math.log(i + 1))

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]

        return vector

_embedding_service: Optional[EmbeddingService] = None

def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
