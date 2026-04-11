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

# Heavy imports moved inside functions to pass Render port-binding health checks.
# from sentence_transformers import SentenceTransformer
# from pinecone import Pinecone

from config import (
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIMENSION,
    HUGGINGFACE_API_KEY,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Singleton Initialization
# ──────────────────────────────────────────────────────────────

# Load the embedding model lazily inside _vectorize to pass Render startup checks!
_embed_model = None
_index = None

def _get_pinecone_index():
    """Lazily initialize the Pinecone index handle."""
    global _index
    if _index is None:
        from pinecone import Pinecone
        _pc = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX_NAME)
        logger.info("Pinecone index '%s' initialized.", PINECONE_INDEX_NAME)
    return _index

logger.info(
    "Memory store module loaded (Lazy-Loading enabled).",
)


# ──────────────────────────────────────────────────────────────
# Embedding Helper
# ──────────────────────────────────────────────────────────────

def _vectorize(text: str) -> list[float]:
    """Convert a text string to a 384-dim embedding vector using Hugging Face API."""
    global _embed_model
    if _embed_model is None:
        logger.info("Lazy-loading Hugging Face Inference Client: %s...", EMBEDDING_MODEL_NAME)
        from huggingface_hub import InferenceClient
        # Initialize inference client
        _embed_model = InferenceClient(api_key=HUGGINGFACE_API_KEY)
        
    try:
        embedding = _embed_model.feature_extraction(
            model=EMBEDDING_MODEL_NAME,
            inputs=text
        )
        return embedding
    except Exception as e:
        logger.error("Error calling Hugging Face Inference API: %s", str(e))
        raise


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

    index = _get_pinecone_index()
    index.upsert(
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

    index = _get_pinecone_index()
    results = index.query(
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
