from app.rag.text_splitter import RecursiveTextSplitter
from app.rag.embeddings import EmbeddingService
from app.rag.vector_store import VectorStoreService

def test_recursive_text_splitter():
    splitter = RecursiveTextSplitter(chunk_size=100, chunk_overlap=20)
    pages = [
        {
            "page_number": 1,
            "text": "Self-attention mechanism relates different positions of a single sequence in order to compute a representation of the sequence. It has been used successfully in reading comprehension, abstractive summarization, textual entailment and learning task-independent sentence representations."
        }
    ]
    chunks = splitter.split_pages(pages, paper_id=99)
    assert len(chunks) > 0
    assert chunks[0].page_number == 1
    assert chunks[0].paper_id == 99

def test_embeddings_and_vector_store():
    embed_service = EmbeddingService(dimension=64)
    vecs = embed_service.embed_texts(["Transformer models use self-attention.", "Convolutional networks use filters."])
    assert len(vecs) == 2
    assert len(vecs[0]) == 64

    # Test in-memory vector store functionality
    store = VectorStoreService(embedding_service=embed_service)
    store.delete_paper_vectors(101)
    splitter = RecursiveTextSplitter(chunk_size=1000, chunk_overlap=50)
    pages = [
        {"page_number": 1, "text": "Deep residual learning for image recognition with skip connections."}
    ]
    chunks = splitter.split_pages(pages, paper_id=101)
    added = store.add_chunks(chunks)
    assert added == len(chunks)

    results = store.similarity_search("residual learning", paper_id=101, top_k=1)
    assert len(results) == 1
    assert "residual" in results[0]["text"].lower()
