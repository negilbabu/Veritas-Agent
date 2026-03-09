# Veritas-Agent
**Privacy-First Agentic RAG Platform for Reliable Document Intelligence**

Veritas-Agent is a production-oriented **Agentic Retrieval-Augmented Generation (RAG)** platform designed for **high-accuracy document analysis**. The system applies a **state-machine-based reasoning workflow** to ensure responses are generated strictly from retrieved evidence rather than hallucinated knowledge.

Originally developed for **medical document analysis**, the platform emphasizes **data privacy, traceability, and reproducibility**, aligning with European data protection standards such as **GDPR**.

---

# Key Features

### Agentic Reasoning Workflow
Built using **LangGraph**, the platform uses a structured state machine where retrieval is treated as an iterative reasoning step rather than a single database lookup.

### Privacy-First Architecture
Document embeddings are generated locally using **SentenceTransformers (all-MiniLM-L6-v2)**, ensuring that sensitive documents are **never transmitted to external services**.

### High-Performance Vector Search
Semantic search is powered by **Qdrant**, enabling efficient retrieval using its optimized **query points API**.

### Fast LLM Inference
Inference is handled through **Groq Cloud (Llama 3.3 70B)**, delivering low-latency responses while maintaining compatibility with OpenAI-style APIs.

### Reproducible Deployment
The entire platform is containerized using **Docker and Docker Compose**, ensuring consistent environments for development and production.

---

# System Architecture

Unlike traditional RAG pipelines that retrieve context once, **Veritas-Agent treats retrieval as part of the reasoning loop**.

The workflow consists of three primary components:

**Router**  
Determines whether a user query requires document retrieval or can be answered directly.

**Retriever**  
Performs semantic search in the Qdrant vector database and populates the agent state with relevant document chunks.

**Generator**  
Uses the retrieved context to synthesize grounded responses while enforcing strict adherence to source information.

This architecture improves reliability and reduces hallucination in domain-specific document analysis.

---

# Technology Stack

**Backend**
- Python 3.10
- FastAPI

**AI Orchestration**
- LangGraph
- LangChain

**Vector Database**
- Qdrant (Docker deployment)

**Embeddings**
- SentenceTransformers (local inference)

**LLM Inference**
- Groq Cloud (Llama 3.3 70B)

**Frontend**
- Next.js 14
- TypeScript
- Tailwind CSS

**DevOps**
- Docker
- Docker Compose
- GitHub Actions (CI/CD)

---

# Local Setup

## Prerequisites
- Docker / Docker Desktop
- Python 3.10+
- Node.js 18+
- Groq Cloud API Key

---

## 1. Clone Repository

```bash
git clone https://github.com/negilbabu/veritas-agent.git
cd veritas-agent
```

---

## 2. Configure Environment Variables

Create a `.env` file in `backend/`:

```
QDRANT_HOST=localhost
QDRANT_PORT=6333
GROQ_API_KEY=your_groq_api_key
```

---

## 3. Start Infrastructure

```bash
docker-compose up -d
```

This launches the **Qdrant vector database**.

---

## 4. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API will be available at:

```
http://localhost:8000
```

---

## 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

---

# Usage

### Document Ingestion
Upload a PDF document using the dashboard.  
The system automatically:

1. Splits the document into semantic chunks  
2. Generates embeddings locally  
3. Stores vectors in Qdrant  

### Querying
Users can ask questions about the uploaded document.  
The backend logs the reasoning flow (**Router → Retriever → Generator**).

### API Access
Interactive API documentation is available via:

```
http://localhost:8000/docs
```

---

# Project Motivation

Reliable document analysis requires **traceable reasoning and strict grounding in source material**. Veritas-Agent explores how **agentic workflows and structured retrieval loops** can improve reliability in RAG systems used in regulated environments such as healthcare.

---

# Author

**Negil Babu**  
Software Engineer | MSc Artificial Intelligence  

Berlin, Germany

LinkedIn  
https://www.linkedin.com/in/negil-babu/

GitHub  
https://github.com/negilbabu

Portfolio  
https://negilbabu.com