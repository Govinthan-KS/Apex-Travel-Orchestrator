import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
OPENTRIPMAP_API_KEY = os.getenv("OPENTRIPMAP_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")  # Fallback web search for when APIs nap

# Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "apex-user-memory")


# Embedding Model
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# Model Settings
MODEL_NAME = "llama-3.3-70b-versatile"
TEMPERATURE = 0  # We want facts, not creative hallucinations
MAX_ITERATIONS = 15
MAX_RESULTS = 5

# Frontend API (Logistics DNA bridge)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
