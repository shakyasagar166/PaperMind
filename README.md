# PaperMind - Intelligent Research Assistant & Multi-Agent RAG Platform

PaperMind is an end-to-end AI-powered academic research assistant built with **FastAPI**, **React**, and an advanced **Retrieval-Augmented Generation (RAG)** pipeline powered by specialized multi-agents.

---

## 🌟 Key Features

- **Automated Paper Ingestion & Parsing**: Extract structured sections, metadata, abstracts, references, and text chunks from academic PDFs.
- **Hybrid RAG Pipeline**: High-dimensional vector embeddings, hybrid semantic & keyword retrieval, and Maximal Marginal Relevance (MMR) re-ranking.
- **Specialized Multi-Agent System**:
  - **Research Agent**: Analyzes papers, synthesizes complex concepts across multiple documents, and answers deep scientific queries.
  - **Summarizer Agent**: Generates executive summaries, methodology teardowns, critical limitations, and key takeaway flashcards.
  - **Citation Agent**: Formats citations in BibTeX, APA, IEEE, MLA, and maps assertions directly to exact page/paragraph sources.
- **Interactive Knowledge Workspace**:
  - Paper catalog and metadata management.
  - Chat interface with inline citations and verifiable source quotes.
  - Real-time document preview and summary generation.
- **Production-Ready Architecture**:
  - JWT Authentication & RBAC.
  - SQLAlchemy ORM with SQLite/PostgreSQL support.
  - Containerized with Docker and Docker Compose.

---

## 🏗️ Architecture Overview

```
PaperMind/
├── backend/               # FastAPI async application
│   ├── app/
│   │   ├── api/           # API endpoints & dependency injection
│   │   ├── agents/        # Autonomous agents (Research, Summarizer, Citation)
│   │   ├── rag/           # PDF ingestion, chunking, embeddings, vector store
│   │   ├── llm/           # LLM service layer (OpenAI, Gemini, Ollama)
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── schemas/       # Pydantic v2 schemas
│   │   ├── services/      # Business logic & orchestration
│   │   └── core/          # Configurations & security
├── frontend/              # Modern React + Vite SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard, Chat, Paper Details, Auth
│   │   └── services/      # API client & token management
├── data/                  # Local storage for raw & processed papers
└── docs/                  # Architecture & API documentation
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OPENAI_API_KEY or preferred provider

uvicorn app.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend Web UI will be running at: `http://localhost:5173`

### 3. Docker Compose (Full Stack)
```bash
docker-compose up --build
```

---

## 📚 Documentation
- [System Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [RAG & Agent Pipeline](docs/rag-pipeline.md)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
