# PaperMind RAG & Multi-Agent Pipeline

## 1. Pipeline Overview

PaperMind implements an advanced, production-grade Retrieval-Augmented Generation (RAG) architecture tailored for complex scientific papers. Academic papers possess high semantic density, structured layouts, formulas, and extensive citation networks that fail under naive RAG implementations.

---

## 2. Ingestion & Preprocessing

```
[Academic PDF]
       │
       ▼
[PDF Parser] ──────► Extract raw text, header hierarchy, and page indices
       │
       ▼
[Text Splitter] ───► Recursive semantic splitting (chunk_size: 1000, overlap: 200)
       │               Maintains page numbers and section labels in metadata
       ▼
[Embeddings] ──────► Vector embeddings (OpenAI text-embedding-3-small or Gemini)
       │
       ▼
[Vector Store] ────► ChromaDB vector indexing with namespace isolation per paper
```

### Key Strategies
- **Layout Awareness**: Header hierarchy preservation (`Introduction`, `Related Work`, `Methodology`, `Experiments`, `Discussion`, `Conclusion`).
- **Citation Isolation**: Bibliography sections are separately cataloged to avoid contaminating semantic searches for methodology details.
- **Metadata Enriched Chunks**: Each chunk carries `paper_id`, `page_number`, `chunk_index`, and `section_title`.

---

## 3. Retrieval & Re-ranking

1. **Query Expansion & Hybrid Search**:
   - The user query is normalized and semantically embedded.
   - Vector search pulls top-$K$ candidates (default $K=10$).
2. **Maximal Marginal Relevance (MMR)**:
   - Balances query relevance with diversity to avoid duplicate chunks from the same paragraph.
3. **Context Assembly**:
   - Chunks are assembled chronologically with explicit citation tags:
   ```text
   [Source: Page 4 | Section: 3.2 Multi-Head Attention]
   Multi-head attention allows the model to jointly attend to information...
   ```

---

## 4. Multi-Agent Ecosystem

### 4.1 Research Agent (`app/agents/research_agent.py`)
- **Role**: Deep conceptual reasoning and synthesis across paper sections.
- **Mechanism**:
  1. Breaks complex queries into focused sub-questions.
  2. Queries the retriever across relevant sections.
  3. Synthesizes an evidence-backed response with inline references.

### 4.2 Summarizer Agent (`app/agents/summarizer_agent.py`)
- **Role**: Multi-perspective distillation.
- **Templates**:
  - **Executive Summary**: High-level problem statement, solution, and breakthrough.
  - **Methodological Breakdown**: Mathematical formulations, dataset details, training setups.
  - **Limitations & Future Work**: Honest critical evaluation of constraints reported by the authors.

### 4.3 Citation Agent (`app/agents/citation_agent.py`)
- **Role**: Verifiability and citation generation.
- **Capabilities**:
  - Compares model responses with chunk text to detect hallucinated statements.
  - Generates standard bibliographic citations in BibTeX, APA, IEEE, and MLA formats.
