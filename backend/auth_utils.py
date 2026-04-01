"""
Apex Travel Orchestrator v2 — HMAC Signature Verification

Security layer that validates incoming requests from the Next.js frontend.
The frontend signs the Logistics DNA payload with HMAC-SHA256 using a shared
secret, and the backend verifies it before spending Groq credits.
"""

import hmac
import hashlib
import json
import os
import logging
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

SHARED_SECRET = os.getenv("INTERNAL_SHARED_SECRET", "")


def compute_hmac(payload: dict) -> str:
    """
    Compute HMAC-SHA256 of a dict payload.

    The payload is serialized to JSON with sorted keys and no whitespace
    to ensure deterministic hashing across Python and Node.js.
    """
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hmac.new(
        SHARED_SECRET.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_signature(payload: dict, signature: str) -> bool:
    """
    Verify that the provided HMAC signature matches the payload.
    Uses hmac.compare_digest for timing-safe comparison.
    """
    expected = compute_hmac(payload)
    return hmac.compare_digest(expected, signature)


async def require_valid_signature(request: Request) -> str:
    """
    FastAPI dependency that extracts and verifies the X-Apex-Signature header.

    Returns the verified signature string on success.
    Raises 403 Forbidden if the signature is missing or invalid.
    """
    if not SHARED_SECRET:
        logger.warning("INTERNAL_SHARED_SECRET not set — signature verification skipped")
        return "no-secret-configured"

    signature = request.headers.get("X-Apex-Signature", "")

    if not signature:
        raise HTTPException(
            status_code=403,
            detail="Missing X-Apex-Signature header. Access denied.",
        )

    # Read the raw body and parse it to get the dna field
    body = await request.json()
    dna = body.get("dna")

    if not dna:
        raise HTTPException(
            status_code=403,
            detail="Missing DNA payload for signature verification.",
        )

    if not verify_signature(dna, signature):
        logger.warning("Invalid HMAC signature from %s", request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=403,
            detail="Invalid signature. Access denied to protect API credits.",
        )

    return signature
