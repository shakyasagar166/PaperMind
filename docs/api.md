# PaperMind API Reference

Base URL: `http://localhost:8000/api`

---

## 🔐 Authentication (`/auth`)

### 1. Register User
- **POST** `/auth/register`
- **Request Body**:
```json
{
  "email": "researcher@university.edu",
  "username": "alex_researcher",
  "password": "SecurePassword123!"
}
```
- **Response** (201 Created):
```json
{
  "id": 1,
  "email": "researcher@university.edu",
  "username": "alex_researcher",
  "created_at": "2026-10-08T10:00:00Z"
}
```

### 2. Login User
- **POST** `/auth/login`
- **Request Body**: Form Data (`username` or `email`, and `password`)
- **Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "researcher@university.edu",
    "username": "alex_researcher"
  }
}
```

---

## 📄 Papers (`/papers`)

### 1. Upload Paper
- **POST** `/papers/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data**: `file` (PDF file binary)
- **Response** (202 Accepted):
```json
{
  "id": 1,
  "title": "Attention Is All You Need",
  "filename": "1706.03762.pdf",
  "status": "processing",
  "total_pages": 15,
  "created_at": "2026-10-08T10:05:00Z"
}
```

### 2. List Papers
- **GET** `/papers`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `skip=0`, `limit=20`, `search=transformer`
- **Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Attention Is All You Need",
    "authors": ["Vaswani et al."],
    "year": 2017,
    "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
    "status": "ready",
    "total_chunks": 42
  }
]
```

### 3. Get Paper Details
- **GET** `/papers/{paper_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK): Detailed paper metadata, abstract, chunk count, and parsing status.

### 4. Delete Paper
- **DELETE** `/papers/{paper_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (204 No Content)

---

## 💬 Chat & Agents (`/chat`)

### 1. Create / Get Chat Session
- **POST** `/chat/sessions`
- **Request Body**:
```json
{
  "paper_id": 1,
  "title": "Clarifying Transformer Self-Attention"
}
```
- **Response** (201 Created): Session object with ID and created timestamp.

### 2. Send Message (RAG Query)
- **POST** `/chat/sessions/{session_id}/messages`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "query": "How is multi-head attention formulated mathematically?",
  "agent_mode": "research" // "research" | "standard"
}
```
- **Response** (200 OK):
```json
{
  "id": 105,
  "role": "assistant",
  "content": "Multi-head attention allows the model to jointly attend to information from different representation subspaces...",
  "citations": [
    {
      "chunk_id": "chunk_3",
      "page_number": 4,
      "snippet": "MultiHead(Q, K, V) = Concat(head_1, ..., head_h)W^O"
    }
  ]
}
```

---

## 📝 Summaries & Citations (`/summary`)

### 1. Generate Structured Summary
- **POST** `/summary/{paper_id}`
- **Request Body**:
```json
{
  "mode": "comprehensive" // "comprehensive" | "executive" | "tldr" | "methodology"
}
```
- **Response** (200 OK):
```json
{
  "paper_id": 1,
  "mode": "comprehensive",
  "executive_summary": "This seminal paper introduces the Transformer architecture...",
  "key_contributions": ["Self-attention mechanism", "Elimination of recurrence"],
  "methodology": "Scaled dot-product attention paired with multi-head projections...",
  "limitations": "Quadratic complexity with respect to sequence length."
}
```

### 2. Generate Citations
- **GET** `/summary/{paper_id}/citations?format=bibtex`
- **Response** (200 OK):
```json
{
  "format": "bibtex",
  "citation_text": "@article{vaswani2017attention, title={Attention is all you need}, ...}"
}
```
