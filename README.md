# AI-Powered RAG FAQ Bot

A single-tenant Retrieval-Augmented Generation (RAG) web application built for business document Q&A using **Next.js**, **Anthropic Claude API**, and an **In-Memory Vector Search Engine**.

---

## Architectural Overview

The application follows a standard RAG architecture split into two main pipelines:

### 1. Ingestion Pipeline (Admin Upload)

1. **Document Parsing**: Admin uploads a PDF document via the UI. The backend parses the PDF buffer using `pdf-parse`.
2. **Text Chunking**: Raw text is split into fixed-size overlapping chunks (500 characters with 100 overlap) to preserve context continuity.
3. **Vector Indexing**: Chunks are processed through a TF-IDF vector engine (calculating Term Frequency and Inverse Document Frequency across all chunks) and stored in an in-memory vector store for ultra-fast retrieval without external DB overhead.

### 2. Retrieval & Generation Pipeline (User Chat)

1. **Semantic Search**: User submits a natural language question. The system runs a vector relevance query against indexed chunks using TF-IDF cosine similarity scoring to select the Top 3 context snippets.
2. **Context Injection & LLM Call**: Selected chunks are injected into a strict system prompt instructing **Claude 3 Haiku** to answer solely based on the provided text.
3. **Response & Citations**: The AI response is streamed to the UI alongside exact document snippet citations and relevance scores.

---

## Setup & Running Instructions

### 1. Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
