"""
Characterization tests for Apex Travel Orchestrator backend current behavior.

Covers:
  - HMAC sign and verify (deterministic serialization, tampering checks, golden fixture)
  - _sanitize_request (IATA uppercasing, invalid hub clearing, control character stripping)
  - _extract_json (clean JSON, code fences, surrounding prose, invalid syntax raising ValueError)
  - 21-day date check in /api/v2/plan (<= 21 days passes, > 21 days raises HTTP 400)
  - Hotel tool filtering (tier checks, budget caps, fallback notes, comma-separated inputs)
"""

import datetime
from fastapi.testclient import TestClient

import auth_utils
from auth_utils import compute_hmac, verify_signature
from main import app, _sanitize_request, PlanRequest
from agents.coordinator_agent import _extract_json
from tools.hotel_tools import search_hotels


# ──────────────────────────────────────────────────────────────
# 1. HMAC Sign / Verify & Golden Cross-Language Test
# ──────────────────────────────────────────────────────────────

def test_golden_cross_language_hmac(golden_dna, golden_secret, golden_expected_hmac, monkeypatch):
    """
    Assert that the fixed golden DNA payload with test secret produces the exact
    canonical HMAC hex digest matching the TypeScript test suite.
    """
    monkeypatch.setattr(auth_utils, "SHARED_SECRET", golden_secret)
    computed = compute_hmac(golden_dna)
    assert computed == golden_expected_hmac
    assert verify_signature(golden_dna, golden_expected_hmac) is True


def test_hmac_verification_detects_tampering(golden_dna, golden_secret, golden_expected_hmac, monkeypatch):
    """Tampering with any field in the DNA payload causes signature verification to fail."""
    monkeypatch.setattr(auth_utils, "SHARED_SECRET", golden_secret)

    tampered_dna = dict(golden_dna)
    tampered_dna["user_id"] = "usr_attacker_666"

    assert verify_signature(tampered_dna, golden_expected_hmac) is False
    assert verify_signature(golden_dna, "0" * 64) is False
    assert verify_signature(golden_dna, "") is False


def test_hmac_deterministic_key_sorting(monkeypatch):
    """HMAC serialization is deterministic regardless of Python dictionary insertion order."""
    monkeypatch.setattr(auth_utils, "SHARED_SECRET", "test-secret-12345678901234567890")

    d1 = {"z_key": "val1", "a_key": "val2", "m_key": {"b": 1, "a": 2}}
    d2 = {"a_key": "val2", "m_key": {"a": 2, "b": 1}, "z_key": "val1"}

    assert compute_hmac(d1) == compute_hmac(d2)


# ──────────────────────────────────────────────────────────────
# 2. _sanitize_request
# ──────────────────────────────────────────────────────────────

def test_sanitize_request_control_characters():
    """ASCII control characters (0x00 - 0x1f, 0x7f) are stripped from travel query."""
    req = PlanRequest(
        user_id="user_123",
        query="Trip to \x00Tokyo\x08 with \x1frelaxing\x7f vibe   ",
    )
    _sanitize_request(req)
    assert req.query == "Trip to Tokyo with relaxing vibe"


def test_sanitize_request_valid_iata_uppercasing():
    """Valid 3-letter IATA code in dna.constraints.home_hub is normalized to uppercase."""
    req = PlanRequest(
        user_id="user_123",
        query="Summer trip",
        dna={"constraints": {"home_hub": "maa"}},
    )
    _sanitize_request(req)
    assert req.dna["constraints"]["home_hub"] == "MAA"


def test_sanitize_request_invalid_iata_cleared():
    """Invalid home_hub values (not 3 uppercase letters) are cleared to empty string."""
    for invalid_hub in ["Chennai", "123", "NYC-JFK", "TOOLONG", "ab", ""]:
        req = PlanRequest(
            user_id="user_123",
            query="Trip",
            dna={"constraints": {"home_hub": invalid_hub}},
        )
        _sanitize_request(req)
        assert req.dna["constraints"]["home_hub"] == ""


def test_sanitize_request_graceful_with_empty_or_none():
    """_sanitize_request handles empty queries or missing DNA without raising."""
    req1 = PlanRequest(user_id="user_123", query="")
    _sanitize_request(req1)
    assert req1.query == ""

    req2 = PlanRequest(user_id="user_123", query="Valid query", dna=None)
    _sanitize_request(req2)
    assert req2.dna is None


# ──────────────────────────────────────────────────────────────
# 3. _extract_json
# ──────────────────────────────────────────────────────────────

def test_extract_json_raw_object():
    """Extracts raw JSON without formatting."""
    raw = '{"flight_query": "BOM to TYO", "hotel_query": "Tokyo 4-star", "attraction_query": "Temples"}'
    result = _extract_json(raw)
    assert result["flight_query"] == "BOM to TYO"
    assert result["hotel_query"] == "Tokyo 4-star"


def test_extract_json_markdown_code_fence():
    """Extracts JSON wrapped in markdown code blocks."""
    fenced = """```json
{
  "flight_query": "MAA to NRT",
  "hotel_query": "Tokyo luxury",
  "attraction_query": "Gardens"
}
```"""
    result = _extract_json(fenced)
    assert result["flight_query"] == "MAA to NRT"


def test_extract_json_surrounded_by_prose():
    """Extracts JSON embedded inside explanatory commentary."""
    prose = """Here are the specialist queries for your itinerary:
{
  "flight_query": "DEL to LHR",
  "hotel_query": "London boutique",
  "attraction_query": "Museums"
}
I hope these specialist queries work well for the planning!"""
    result = _extract_json(prose)
    assert result["flight_query"] == "DEL to LHR"
    assert result["attraction_query"] == "Museums"


def test_extract_json_raises_on_invalid_text():
    """Raises ValueError when no valid JSON object can be extracted."""
    import pytest
    with pytest.raises(ValueError, match="No JSON object found in LLM response"):
        _extract_json("I could not generate queries because of an internal model error.")


# ──────────────────────────────────────────────────────────────
# 4. 21-Day Date Check
# ──────────────────────────────────────────────────────────────

def test_plan_date_within_21_days_allowed(mock_coordinator):
    """Trips scheduled within 21 days are accepted by the date boundary check."""
    client = TestClient(app)
    # 5 days into the future
    future_date = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=5)).date().isoformat()

    response = client.post(
        "/api/v2/plan",
        json={
            "user_id": "usr_test_date_ok",
            "query": "Trip to Tokyo",
            "start_date": f"{future_date}T00:00:00Z",
        },
    )
    # Should not fail with 400 21-day validation error
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_plan_date_exceeding_21_days_rejected():
    """Trips scheduled beyond 21 days raise HTTP 400 with specific validation message."""
    client = TestClient(app)
    # 25 days into the future
    far_future = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=25)).date().isoformat()

    response = client.post(
        "/api/v2/plan",
        json={
            "user_id": "usr_test_date_far",
            "query": "Trip to Tokyo",
            "start_date": f"{far_future}T00:00:00Z",
        },
    )
    assert response.status_code == 400
    assert "Trips can only be scheduled up to 21 days in advance" in response.json()["detail"]


def test_plan_invalid_date_format_passes_silently(mock_coordinator):
    """Invalid date strings are ignored by the date parser without raising 400."""
    client = TestClient(app)
    response = client.post(
        "/api/v2/plan",
        json={
            "user_id": "usr_test_invalid_date",
            "query": "Trip to Tokyo",
            "start_date": "not-a-valid-iso-date",
        },
    )
    # Passes date check and returns 200 via mocked LLM pipeline
    assert response.status_code == 200



# ──────────────────────────────────────────────────────────────
# 5. Hotel Tool Filtering
# ──────────────────────────────────────────────────────────────

def test_hotel_tool_budget_filtering():
    """search_hotels filters by budget per night and budget tier."""
    res = search_hotels.invoke({"city": "Tokyo", "budget_per_night": 100.0, "stay_tier": "budget"})
    assert "Hotels in Tokyo (Tier: Budget, Budget: $100.0/night):" in res
    assert "Sakura Budget Inn" in res
    # Expensive hotels should not be included
    assert "Imperial Tokyo Palace" not in res


def test_hotel_tool_luxury_filtering():
    """search_hotels filters for luxury/resort tier with rating >= 4.5."""
    res = search_hotels.invoke({"city": "Tokyo", "budget_per_night": 500.0, "stay_tier": "luxury"})
    assert "Hotels in Tokyo (Tier: Luxury, Budget: $500.0/night):" in res
    assert "Imperial Tokyo Palace" in res
    assert "Sakura Budget Inn" not in res


def test_hotel_tool_budget_too_low_for_luxury_shows_note():
    """When budget is too low for luxury tier, options are returned with an explanatory note."""
    res = search_hotels.invoke({"city": "Tokyo", "budget_per_night": 50.0, "stay_tier": "luxury"})
    assert "Note: These exceed the $50.0/night budget but match the 'Luxury' tier preference" in res
    assert "Imperial Tokyo Palace" in res


def test_hotel_tool_comma_separated_string_input():
    """search_hotels handles single comma-separated input from ReAct agent."""
    res = search_hotels.invoke("Tokyo, 150, 2026-06-01, budget")
    assert "Hotels in Tokyo" in res
    assert "Sakura Budget Inn" in res


def test_hotel_tool_unknown_city():
    """search_hotels returns error string when city is not supported."""
    res = search_hotels.invoke({"city": "Atlantis"})
    assert "Error: 'Atlantis' is not in our database." in res

