"""
Apex Travel Orchestrator v2 — Semantic Memory Store
====================================================

Pinecone vector store + local sentence-transformers embeddings.
Provides the "Vibe Engine" for storing and retrieving user travel
preferences as semantic memories with strict per-user namespacing.

Model  : all-MiniLM-L6-v2 (384-dim, local inference)
DB     : Pinecone (serverless / pod)
Isolation: Each user_id gets its own Pinecone namespace
"""

import uuid
import logging
import warnings
import os

# Suppress noisy HuggingFace / transformers warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore", message=".*UNEXPECTED.*")
warnings.filterwarnings("ignore", message=".*unauthenticated.*")

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

from config import (
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIMENSION,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Singleton Initialization
# ──────────────────────────────────────────────────────────────

# Load the embedding model lazily inside _vectorize to pass Render startup checks!
_embed_model = None

# Initialize Pinecone client and grab the index handle.
_pc = Pinecone(api_key=PINECONE_API_KEY)
_index = _pc.Index(PINECONE_INDEX_NAME)

logger.info(
    "Memory store initialized — index=%s, dim=%d",
    PINECONE_INDEX_NAME,
    EMBEDDING_DIMENSION,
)


# ──────────────────────────────────────────────────────────────
# Embedding Helper
# ──────────────────────────────────────────────────────────────

def _vectorize(text: str) -> list[float]:
    """Convert a text string to a 384-dim embedding vector."""
    global _embed_model
    if _embed_model is None:
        logger.info("Lazy-loading PyTorch model: %s...", EMBEDDING_MODEL_NAME)
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        
    return _embed_model.encode(text).tolist()


# ──────────────────────────────────────────────────────────────
# The "Vibe" Engine
# ──────────────────────────────────────────────────────────────

def upsert_user_vibe(user_id: str, text_description: str) -> dict:
    """
    Upsert a travel "vibe" (preference / memory) into Pinecone.

    Args:
        user_id:          The authenticated user's ID (used as namespace).
        text_description: Free-form text describing a preference or memory,
                          e.g. "I love boutique hotels near the beach."

    Returns:
        dict with the vector id and upserted_count.
    """
    vector = _vectorize(text_description)
    vector_id = f"vibe-{uuid.uuid4().hex[:12]}"

    _index.upsert(
        vectors=[
            {
                "id": vector_id,
                "values": vector,
                "metadata": {
                    "text": text_description,
                    "user_id": user_id,
                },
            }
        ],
        namespace=user_id,  # strict data isolation per user
    )

    logger.info("Upserted vibe %s for user %s", vector_id, user_id)
    return {"id": vector_id, "upserted_count": 1}


def retrieve_relevant_vibes(
    user_id: str,
    current_query: str,
    top_k: int = 3,
) -> list[str]:
    """
    Retrieve the most relevant stored vibes for a user given a query.

    Args:
        user_id:       The user's namespace to search within.
        current_query: The current search query / travel intent.
        top_k:         Number of results to return (default 3).

    Returns:
        List of text descriptions from the top matching vibes.
    """
    query_vector = _vectorize(current_query)

    results = _index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True,
        namespace=user_id,  # only search this user's memories
    )

    vibes = []
    for match in results.get("matches", []):
        text = match.get("metadata", {}).get("text", "")
        score = match.get("score", 0)
        if text:
            vibes.append(text)
            logger.debug("  vibe (%.3f): %s", score, text[:80])

    logger.info(
        "Retrieved %d vibes for user %s (query: '%s')",
        len(vibes), user_id, current_query[:50],
    )
    return vibes
