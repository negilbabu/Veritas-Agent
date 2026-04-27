<h1 align="center">
  Veritas AI | Agentic RAG Platform 🤖🛡️
</h1>

<p align="center">
  <strong>A privacy-first, state-machine driven Retrieval-Augmented Generation (RAG) ecosystem for high-accuracy document intelligence.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangGraph-State_Machine-black?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/VectorDB-Qdrant-ff4136?style=for-the-badge&logo=qdrant" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Frontend-Next.js_14-000000?style=for-the-badge&logo=next.js" alt="Next.js" />
</p>

---

## 📖 Executive Summary

**Veritas AI** is a production-oriented Agentic RAG platform engineered for industries where accuracy and privacy are non-negotiable (e.g., Medical, Fintech, Legal). Unlike traditional "Linear RAG" pipelines that often suffer from context loss and hallucinations, Veritas utilizes a **Graph-based State Machine** to treat retrieval as an iterative reasoning process. By combining local embedding generation with high-speed inference, the platform ensures that sensitive data remains traceable, grounded, and secure.

---

## 🚀 Architectural Deep-Dive

### 🧠 Agentic Reasoning (LangGraph & LangChain)
The core of Veritas is a deterministic graph that manages the flow of information:
- **Intelligent Router:** Analyzes user intent to decide between direct synthesis or multi-step document retrieval based on state context.
- **Evidence Grounding:** A "Generator" node programmatically restricted to only use retrieved context, effectively eliminating off-topic hallucinations.
- **State Persistence:** Utilizes a structured state object to maintain context throughout complex, multi-turn reasoning loops.

### 🔐 Privacy-Centric Engineering
- **Local Embedding Ingestion:** Veritas uses `SentenceTransformers` (`all-MiniLM-L6-v2`) to generate embeddings on-premise. Sensitive document content is never transmitted to third-party embedding providers.
- **Stateless Inference:** Leveraging **Groq Cloud (Llama 3.3 70B)** via optimized API layers to deliver sub-second inference speeds while maintaining strict data handling boundaries.

### ⚡ High-Performance Retrieval (Qdrant)
- **Vector Search:** Semantic search is powered by a containerized **Qdrant** instance, utilizing optimized HNSW indexing for high-speed similarity lookups across large-scale document corpuses.

---

## 🛠️ Enterprise Tech Stack

| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI (Python 3.10)** | High-performance asynchronous API gateway |
| **AI Orchestration**| **LangGraph / LangChain** | State-machine based agent logic and flow control |
| **Vector Engine** | **Qdrant (Docker)** | Low-latency semantic search and metadata filtering |
| **Embeddings** | **SentenceTransformers** | Local-first, privacy-preserving vectorization |
| **LLM Inference** | **Groq (Llama 3.3 70B)** | Ultra-fast token generation and reasoning |
| **Frontend UI** | **Next.js 14 / Tailwind** | Responsive, TypeScript-based dashboard |
| **DevOps** | **Docker / Docker Compose** | Reproducible, containerized deployment ecosystem |

---

## ✨ Key Technical Features

- **Automated Document Ingestion:** PDF processing pipeline including semantic chunking, embedding generation, and vector storage  
- **Traceable Reasoning:** Logs full reasoning path (Router → Retriever → Generator) for auditability  
- **Interactive Dashboards:** Next.js interface for document management and chat interaction  
- **Developer-First API:** OpenAPI (Swagger/ReDoc) documented endpoints  

---

## 🚀 Local Deployment

### Prerequisites
- Docker & Docker Compose  
- Python 3.10+  
- Node.js 18+  
- Groq API Key  

---

### 1. Infrastructure Setup

Launch the Qdrant vector database:

```bash
docker-compose up -d
```

---

### 2. Backend Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with:
# QDRANT_HOST=localhost
# QDRANT_PORT=6333
# GROQ_API_KEY=your_api_key

uvicorn app.main:app --reload
```

---

### 3. Frontend Installation

```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Future Roadmap

- [ ] Multi-Vector Retrieval (Parent-document retrieval)
- [ ] Feedback Loop for response evaluation
- [ ] Self-correction reviewer node for validation

---

## 👨‍💻 Author

**Negil Babu**  
Software Engineer | MSc Artificial Intelligence  
Berlin, Germany  

LinkedIn | GitHub | Portfolio  

---

## 📄 License

This project is licensed under the MIT License.
