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

# Google Gemini (sub-agents)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Model Settings
# ─────────────────────────────────────────────────────────────────
# Coordinator: compound-beta on Groq — 70K TPM, no daily cap,
# designed for orchestration tasks. Replaces llama-3.3-70b-versatile
# (decommissioned Aug 17 2026).
COORDINATOR_MODEL = "compound-beta"

# Sub-agents: gemini-3.5-flash-lite — best fit for this agentic workload.
# 15 RPM / 250K TPM / 500 RPD vs gemini-3.5-flash's 5 RPM / 20 RPD.
# 20 RPD on the full flash = ~2 planning sessions/day (too low for dev).
# 500 RPD on flash-lite = ~55 sessions/day. Same TPM, newer than 3.1-flash-lite.
SUB_AGENT_MODEL = "gemini-3.5-flash-lite"

TEMPERATURE = 0  # We want facts, not creative hallucinations
MAX_ITERATIONS = 15
MAX_RESULTS = 5


# Frontend API (Logistics DNA bridge)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
