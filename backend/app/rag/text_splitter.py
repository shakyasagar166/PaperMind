import re
from typing import List, Dict, Any
from dataclasses import dataclass, field

@dataclass
class DocumentChunk:
    chunk_id: str
    paper_id: int
    page_number: int
    chunk_index: int
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)

class RecursiveTextSplitter:
    """Splits academic texts recursively by paragraphs, sentences, and words while preserving context."""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "; ", " ", ""]

    def split_pages(
        self,
        pages: List[Dict[str, Any]],
        paper_id: int
    ) -> List[DocumentChunk]:
        """Split a list of extracted PDF pages into indexed DocumentChunks."""
        chunks: List[DocumentChunk] = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"]

            if not page_text.strip():
                continue

            page_splits = self._split_text(page_text)
            for split_idx, split_text in enumerate(page_splits):
                chunk_id = f"p{paper_id}_pg{page_num}_c{split_idx}"
                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    paper_id=paper_id,
                    page_number=page_num,
                    chunk_index=global_chunk_idx,
                    text=split_text,
                    metadata={
                        "paper_id": paper_id,
                        "page_number": page_num,
                        "chunk_index": global_chunk_idx,
                    }
                ))
                global_chunk_idx += 1

        return chunks

    def _split_text(self, text: str) -> List[str]:
        """Recursively split text into segments satisfying chunk_size and chunk_overlap."""
        splits = self._recursive_split(text, self.separators)
        return self._merge_splits(splits)

    def _recursive_split(self, text: str, separators: List[str]) -> List[str]:
        """Recursively partition text using hierarchic separators."""
        final_pieces = []
        separator = separators[-1]
        new_separators = []

        for i, sep in enumerate(separators):
            if sep == "" or sep in text:
                separator = sep
                new_separators = separators[i + 1:]
                break

        splits = text.split(separator) if separator else list(text)

        for s in splits:
            if not s:
                continue
            if len(s) <= self.chunk_size:
                final_pieces.append(s)
            elif new_separators:
                final_pieces.extend(self._recursive_split(s, new_separators))
            else:
                # Force chunk by character length if no separators remain
                for j in range(0, len(s), self.chunk_size):
                    final_pieces.append(s[j:j + self.chunk_size])

        return final_pieces

    def _merge_splits(self, pieces: List[str]) -> List[str]:
        """Merge short pieces up to chunk_size with chunk_overlap."""
        merged: List[str] = []
        current: List[str] = []
        current_len = 0

        for piece in pieces:
            piece_len = len(piece)
            if current_len + piece_len > self.chunk_size and current:
                merged_str = " ".join(current).strip()
                if merged_str:
                    merged.append(merged_str)
                # Keep overlap
                while current and current_len > self.chunk_overlap:
                    popped = current.pop(0)
                    current_len -= len(popped) + 1

            current.append(piece)
            current_len += piece_len + 1

        if current:
            final_str = " ".join(current).strip()
            if final_str:
                merged.append(final_str)

        return merged
