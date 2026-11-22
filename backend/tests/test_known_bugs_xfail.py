"""
Known bugs documented as expected failures (xfail) for Apex Travel Orchestrator backend.

These tests assert correct / secure behavior and will XFAIL against the current codebase
until addressed in future remediation stages.
"""

import pytest
from fastapi.testclient import TestClient
import auth_utils
from main import app
from auth_utils import compute_hmac
from tools.flight_tools import search_flights



# ──────────────────────────────────────────────────────────────
# Bug 1: Flight tool argument-schema crash
# ──────────────────────────────────────────────────────────────

@pytest.mark.xfail(
    strict=True,
    reason="Flight tool argument schema expects arrival_city as separate param, but ReAct agent prompt instructs single comma-separated string, causing Pydantic ValidationError",
)
def test_flight_tool_argument_schema_crash():
    """
    The ReAct agent prompt instructs:
      Action Input: departure_city, arrival_city, YYYY-MM-DD
    Calling search_flights.invoke with a single comma-separated string should parse
    the fields and return flight search results, but currently raises Pydantic ValidationError
    because arrival_city has no default value in search_flights(departure_city, arrival_city, ...).
    """
    # Calling with single comma-separated string as ReAct agent does
    result = search_flights.invoke("MAA, NRT, 2026-08-05")
    assert "Flights from" in result or "No flights found" in result


# ──────────────────────────────────────────────────────────────
# Bug 2: user_id not validated against signed DNA
# ──────────────────────────────────────────────────────────────

@pytest.mark.xfail(
    strict=True,
    reason="Security: req.user_id is not validated against req.dna['user_id'], allowing user impersonation with valid signature",
)
def test_user_id_mismatch_with_signed_dna(golden_dna, golden_secret, monkeypatch, mock_groq, mock_gemini, mock_pinecone, mock_huggingface):
    """
    When a request provides a signed DNA payload belonging to user Alice (golden_dna['user_id'] = 'usr_test_golden_12345'),
    but the top-level request body sets req.user_id = 'usr_attacker_bob', the backend should reject the
    request with HTTP 400 or 403. Currently it accepts it and returns HTTP 200.
    """
    monkeypatch.setattr(auth_utils, "SHARED_SECRET", golden_secret)
    monkeypatch.setenv("INTERNAL_SHARED_SECRET", golden_secret)
    valid_signature = compute_hmac(golden_dna)

    client = TestClient(app)
    response = client.post(
        "/api/v2/plan",
        headers={"X-Apex-Signature": valid_signature},
        json={
            "user_id": "usr_attacker_bob",  # Mismatched user_id
            "query": "Trip to Tokyo",
            "dna": golden_dna,
        },
    )
    # The secure expectation is that mismatch is rejected
    assert response.status_code in (400, 403), f"Expected 400/403 but got {response.status_code}: {response.text}"


# ──────────────────────────────────────────────────────────────
# Bug 3: POST /api/v2/sync-vibe allows unauthenticated access
# ──────────────────────────────────────────────────────────────

@pytest.mark.xfail(
    strict=True,
    reason="Security: POST /api/v2/sync-vibe allows unauthenticated access and arbitrary user_id namespace writes",
)
def test_unauthenticated_sync_vibe(mock_pinecone, mock_huggingface):
    """
    POST /api/v2/sync-vibe writes directly to a user's Pinecone namespace without any
    HMAC signature or bearer token validation. Secure behavior should require authentication (401 or 403).
    Currently it returns HTTP 200.
    """
    client = TestClient(app)
    response = client.post(
        "/api/v2/sync-vibe",
        json={
            "user_id": "usr_victim_namespace",
            "vibe_text": "I like luxury beach resorts and late dinners.",
        },
    )
    assert response.status_code in (401, 403), f"Expected 401/403 but got {response.status_code}: {response.text}"


# ──────────────────────────────────────────────────────────────
# Bug 4: POST /api/v2/context allows unauthenticated access
# ──────────────────────────────────────────────────────────────

@pytest.mark.xfail(
    strict=True,
    reason="Security: POST /api/v2/context allows unauthenticated retrieval of user context/memories",
)
def test_unauthenticated_context(mock_pinecone, mock_huggingface):
    """
    POST /api/v2/context reads a user's augmented context and semantic memories without
    authentication. Secure behavior should require authentication (401 or 403).
    Currently it returns HTTP 200.
    """
    client = TestClient(app)
    response = client.post(
        "/api/v2/context",
        json={
            "user_id": "usr_victim_namespace",
            "query": "Where do I usually like to stay?",
        },
    )
    assert response.status_code in (401, 403), f"Expected 401/403 but got {response.status_code}: {response.text}"
