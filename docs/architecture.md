# PaperMind System Architecture

## 1. System Overview

PaperMind is designed as a modular, decoupled research assistant system. It integrates an asynchronous Python backend built with FastAPI with a modern reactive frontend built in React/Vite.

```
       ┌────────────────┐
       │  React Web UI  │ (Vite, Tailwind, Component Architecture)
       └───────┬────────┘
               │ REST / JSON (JWT Authenticated)
               ▼
       ┌────────────────┐
       │  FastAPI Core  │ (Dependency Injection, Routing, Auth)
       └───────┬────────┘
               ├──► Services (PaperService, ChatService, SummaryService)
               │      ├──► Database Layer (SQLAlchemy / SQLite / Postgres)
               │      ├──► Multi-Agent Layer
               │      │      ├── Research Agent (Decomposition & Synthesis)
               │      │      ├── Summarizer Agent (Multi-perspective digest)
               │      │      └── Citation Agent (Verifiable attribution & BibTeX)
               │      └──► RAG Pipeline Layer
               │             ├── Document Ingestion & PyPDF Parser
               │             ├── Semantic Recursive Text Splitter
               │             ├── Vector Store (ChromaDB / FAISS)
               │             └── MMR Retriever & Context Builder
               └──► Unified LLM Service (OpenAI GPT-4o, Anthropic Claude, Gemini)
```

---

## 2. Component Breakdown

### 2.1 Backend Architecture (`backend/app`)
- **`core/`**: Configuration management (`config.py`) using Pydantic Settings and cryptographic utilities (`security.py`) for JWT access token encoding/decoding and bcrypt password hashing.
- **`database/`**: Sessionmaker, declarative base, and automated schema migration utilities.
- **`models/` & `schemas/`**: Strict relational mapping (Users, Papers, Chunks, ChatSessions, Messages) with Pydantic validation for request/response payloads.
- **`rag/`**: End-to-end document processing:
  1. PDF parsing and layout preservation.
  2. Recursive chunking with overlap and metadata injection (page, section).
  3. High-dimensional vector embeddings generation.
  4. Vector database indexing with metadata filtering per user and per paper.
  5. Top-K semantic retriever with relevance scoring.
- **`agents/`**:
  - **Research Agent**: Implements iterative thought-action-observation or prompt-chaining reasoning to explore a paper corpus.
  - **Summarizer Agent**: Uses custom prompts to generate structured sections: Executive Summary, Methodology, Novel Contributions, Limitations, and Practical Implications.
  - **Citation Agent**: Parses academic references, checks in-text claims against retrieved chunks, and generates exportable BibTeX entries.
- **`api/routes/`**: RESTful API endpoints organized by domain (`/auth`, `/papers`, `/chat`, `/summary`).

### 2.2 Frontend Architecture (`frontend/src`)
- **Components**: Modals, chat boxes with markdown/math rendering, paper cards, and drag-and-drop file uploaders.
- **Pages**: Authentication screens, responsive dashboard, detailed paper inspector, and split-screen conversational research interface.
- **Services**: Axios instance with automated Authorization Bearer header injection, refresh handling, and typed API responses.

---

## 3. Data Flow

### Paper Ingestion Pipeline
1. User uploads a research PDF via the Frontend (`/api/papers/upload`).
2. `PaperService` saves the raw file to `data/papers/<paper_id>.pdf`.
3. `PDFParser` extracts text, page boundaries, and section headers.
4. `TextSplitter` chunks content into overlapping segments (e.g., 800 tokens, 150 token overlap).
5. `Embeddings` service computes vectors.
6. `VectorStore` persists chunk vectors and assigns `paper_id` metadata.
7. Database updates paper status from `PROCESSING` to `READY`.

### Question & Answering (RAG)
1. User asks a question in the chat room (`/api/chat/message`).
2. `ChatService` loads conversation history and calls `ResearchAgent`.
3. Agent invokes `Retriever` with user query filtered to the active paper context.
4. Vector Store returns the top relevant chunks with page citations.
5. LLM generates a grounded response, embedding inline references `[Page X, Chunk Y]`.
6. `CitationAgent` verifies claims against the source chunks and outputs accurate citations.
