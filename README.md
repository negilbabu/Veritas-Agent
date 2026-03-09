**Veritas-Agent**: Privacy-First Agentic RAG Platform
Veritas-Agent is a production-grade, "Agentic" Retrieval-Augmented Generation (RAG) system designed for high-accuracy document intelligence. Originally developed as a medical document analyzer, the platform utilizes a state-machine architecture to handle complex reasoning, ensuring that responses are grounded strictly in provided data.

To align with European data privacy standards (GDPR), the system employs local embedding generation and isolated vector storage, ensuring sensitive information remains within a controlled environment.

🚀 **Core Features**
Agentic Workflow: Built with LangGraph, the system uses a multi-node state machine to route queries, grade document relevance, and self-correct search parameters.

Privacy-First Architecture: Utilizes local HuggingFace embeddings (all-MiniLM-L6-v2) to ensure data is vectorized on-device without external API transmission.

High-Performance Vector Retrieval: Integrated with Qdrant, leveraging its "query points" API for optimized semantic search.

Hybrid LLM Integration: Optimized for Groq (Llama 3.3 70B) for ultra-fast, cost-effective inference while maintaining an OpenAI-compatible interface.

Containerized Orchestration: Full system deployment via Docker, ensuring reproducibility across development and production environments.

🏗️ **Technical Architecture**
Unlike standard linear RAG pipelines, Veritas-Agent operates on a cyclic graph that treats retrieval as a "reasoning step" rather than a one-time fetch.

The Router: Analyzes the intent of the user query to determine if a vector database search is required.

The Retriever: Performs semantic search in Qdrant and populates the agent's state with relevant context.

The Generator: Synthesizes a final response using a specialized system prompt that enforces strict grounding in the retrieved context.

🛠️ **Tech Stack**
Backend: FastAPI (Python 3.10)

AI Orchestration: LangGraph, LangChain

Vector Database: Qdrant (Deployed via Docker)

Embeddings: Sentence-Transformers (Local)

LLM Inference: Groq Cloud (Llama 3.3 70B)

Frontend: Next.js 14, TypeScript, Tailwind CSS

DevOps: Docker, Docker Compose, GitHub Actions (CI/CD)

🔧 **Installation & Local Setup**
Follow these steps to recreate the environment and run the platform locally.

Prerequisites
Docker and Docker Desktop

Python 3.10+

Node.js 18+

A Groq Cloud API Key

1. Clone the Repository
Bash
git clone https://github.com/negilbabu/veritas-agent.git
cd veritas-agent
2. Configure Environment Variables
Create a .env file in the backend/ directory:

Plaintext
QDRANT_HOST=localhost
QDRANT_PORT=6333
GROQ_API_KEY=your_groq_api_key_here
3. Launch Infrastructure (Docker)
Start the Qdrant vector database:

Bash
docker-compose up -d
4. Setup Backend
Bash
cd backend
python -m venv venv
source venv/bin/scripts/activate  # On Windows use: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
5. Setup Frontend
Bash
cd ../frontend
npm install
npm run dev
📖 **Usage Guide**
Access the Dashboard: Open http://localhost:3000 in your browser.

Knowledge Ingestion: Use the "Upload" feature to process a PDF (e.g., a medical report). The system will split the document into recursive chunks and store them in Qdrant.

Querying: Ask questions about the document. The backend terminal will log the transition from research_router to retrieve_documents, showing the agent's "thinking" process.

API Documentation: Visit http://localhost:8000/docs to interact with the raw FastAPI endpoints via Swagger UI.

👤 **Contact**
Negil Babu Software Developer | AI Engineer

Berlin, Germany

[LinkedIn](https://www.linkedin.com/in/negil-babu/) | [GitHub](https://github.com/negilbabu) | [Website](https://negilbabu.com/)

