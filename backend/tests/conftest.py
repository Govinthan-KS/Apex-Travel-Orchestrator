"""
Pytest configuration and external service mock fixtures for Apex Travel Orchestrator backend.

Mocks:
  - Groq (ChatGroq)
  - Google Gemini (ChatGoogleGenerativeAI)
  - HuggingFace (InferenceClient)
  - Pinecone (Pinecone Client & Index)
  - AviationStack (requests.get to api.aviationstack.com)
  - Tavily (TavilyClient)
  - OpenTripMap (requests.get to api.opentripmap.com)
  - Open-Meteo (requests.get to geocoding-api and api.open-meteo.com)
"""

import os
import json
import pytest
from unittest.mock import MagicMock, patch

# Ensure test-safe environment variables are present before any module imports
os.environ.setdefault("INTERNAL_SHARED_SECRET", "test-shared-secret-for-backend-unit-tests-32char")
os.environ.setdefault("GROQ_API_KEY", "mock-groq-api-key")
os.environ.setdefault("GOOGLE_API_KEY", "mock-google-api-key")
os.environ.setdefault("HUGGINGFACE_API_KEY", "mock-hf-api-key")
os.environ.setdefault("PINECONE_API_KEY", "mock-pinecone-api-key")
os.environ.setdefault("PINECONE_INDEX_NAME", "apex-test-index")
os.environ.setdefault("AVIATIONSTACK_API_KEY", "mock-aviationstack-api-key")
os.environ.setdefault("TAVILY_API_KEY", "mock-tavily-api-key")
os.environ.setdefault("OPENTRIPMAP_API_KEY", "mock-opentripmap-api-key")


class MockRequestsResponse:
    """Mock requests.Response for external API calls."""
    def __init__(self, json_data, status_code=200):
        self._json_data = json_data
        self.status_code = status_code

    def json(self):
        return self._json_data

    @property
    def text(self):
        return json.dumps(self._json_data)


def mock_requests_get(url, *args, **kwargs):
    """Intercept HTTP GET calls to external APIs with mocked responses."""
    url_str = str(url)

    # AviationStack API
    if "api.aviationstack.com" in url_str:
        return MockRequestsResponse({
            "data": [
                {
                    "airline": {"name": "Mock Airways"},
                    "flight": {"number": "MA101"},
                    "flight_status": "scheduled",
                },
                {
                    "airline": {"name": "Global Pacific"},
                    "flight": {"number": "GP202"},
                    "flight_status": "scheduled",
                },
            ]
        })

    # Open-Meteo Geocoding API
    if "geocoding-api.open-meteo.com" in url_str:
        return MockRequestsResponse({
            "results": [
                {
                    "name": "Tokyo",
                    "latitude": 35.6762,
                    "longitude": 139.6503,
                }
            ]
        })

    # Open-Meteo Forecast API
    if "api.open-meteo.com" in url_str:
        return MockRequestsResponse({
            "daily": {
                "weathercode": [0]
            }
        })

    # OpenTripMap API
    if "api.opentripmap.com" in url_str:
        return MockRequestsResponse([
            {"name": "Mock Historic Landmark", "kinds": "historic,monument"},
            {"name": "Mock Art Museum", "kinds": "museum,cultural"},
        ])

    # Disallow unmocked outbound HTTP calls during test execution
    raise RuntimeError(f"Unmocked outbound network call intercepted: {url_str}")


@pytest.fixture(autouse=True)
def mock_all_external_http(monkeypatch):
    """Autouse fixture ensuring all requests.get calls are intercepted and never hit live networks."""
    import requests
    monkeypatch.setattr(requests, "get", mock_requests_get)


@pytest.fixture
def mock_groq(monkeypatch):
    """Mock ChatGroq to return valid Phase 1 query JSON."""
    mock_llm_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "flight_query": "Flights from BOM to Tokyo on 2026-06-01, economy class",
        "hotel_query": "Tokyo, budget 200, check-in 2026-06-01, mid_range tier",
        "attraction_query": "Tokyo sights, cultural, moderate pace",
    })
    mock_llm_instance.invoke.return_value = mock_response

    mock_chat_groq = MagicMock(return_value=mock_llm_instance)
    monkeypatch.setattr("langchain_groq.ChatGroq", mock_chat_groq)
    try:
        import agents.coordinator_agent as ca
        monkeypatch.setattr(ca, "ChatGroq", mock_chat_groq)
    except Exception:
        pass
    return mock_llm_instance


@pytest.fixture
def mock_gemini(monkeypatch):
    """Mock ChatGoogleGenerativeAI to return valid Phase 3 JSON itinerary array."""
    mock_llm_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps([
        {
            "status": "Flight to Tokyo",
            "date": "Day 1 - Morning",
            "icon": "pi pi-send",
            "color": "#7ec8e3",
            "description": "Flight from BOM to Tokyo on Mock Airways MA101.",
        },
        {
            "status": "Check-in Hotel",
            "date": "Day 1 - Afternoon",
            "icon": "pi pi-building",
            "color": "#f7d9d9",
            "description": "Check in to Shinjuku Grand Hotel.",
        },
        {
            "status": "Trip Summary",
            "date": "Day 3 - Evening",
            "icon": "pi pi-wallet",
            "color": "#7ec8e3",
            "description": "Estimated total trip cost: $1200.",
        },
    ])
    mock_llm_instance.invoke.return_value = mock_response

    mock_chat_gemini = MagicMock(return_value=mock_llm_instance)
    monkeypatch.setattr("langchain_google_genai.ChatGoogleGenerativeAI", mock_chat_gemini)
    for mod_name in ["agents.coordinator_agent", "agents.flight_agent", "agents.hotel_agent", "agents.attraction_agent"]:
        try:
            import importlib
            mod = importlib.import_module(mod_name)
            monkeypatch.setattr(mod, "ChatGoogleGenerativeAI", mock_chat_gemini)
        except Exception:
            pass
    return mock_llm_instance


@pytest.fixture
def mock_coordinator(monkeypatch):
    """Mock run_coordinator_agent to return valid mock itinerary JSON without running full agent pipeline."""
    mock_itinerary = json.dumps([
        {
            "status": "Mock Flight to Destination",
            "date": "Day 1 - Morning",
            "icon": "pi pi-send",
            "color": "#7ec8e3",
            "description": "Flight from BOM to Destination.",
        },
        {
            "status": "Trip Summary",
            "date": "Day 2 - Evening",
            "icon": "pi pi-wallet",
            "color": "#7ec8e3",
            "description": "Total cost: $1000.",
        },
    ])
    try:
        import agents.coordinator_agent as ca
        monkeypatch.setattr(ca, "run_coordinator_agent", lambda *args, **kwargs: mock_itinerary)
    except Exception:
        pass
    return mock_itinerary


@pytest.fixture
def mock_huggingface(monkeypatch):
    """Mock HuggingFace InferenceClient feature extraction."""
    mock_client = MagicMock()
    # 384-dimensional embedding vector
    mock_client.feature_extraction.return_value = [0.05] * 384

    monkeypatch.setattr("huggingface_hub.InferenceClient", MagicMock(return_value=mock_client))
    import memory_store as ms
    ms._embed_model = mock_client
    return mock_client


@pytest.fixture
def mock_pinecone(monkeypatch):
    """Mock Pinecone client and index operations."""
    class MockMatch:
        def __init__(self, metadata, score):
            self.metadata = metadata
            self.score = score

    class MockQueryResponse:
        def __init__(self, matches):
            self.matches = matches

    mock_index = MagicMock()
    mock_index.upsert.return_value = {"upserted_count": 1}
    mock_index.query.return_value = MockQueryResponse([
        MockMatch(metadata={"text": "Loved visiting Shinjuku gardens in spring", "user_id": "test_user"}, score=0.88),
    ])

    mock_pc = MagicMock()
    mock_pc.Index.return_value = mock_index

    monkeypatch.setattr("pinecone.Pinecone", MagicMock(return_value=mock_pc))
    import memory_store as ms
    ms._index = mock_index
    return mock_index


@pytest.fixture
def mock_tavily(monkeypatch):
    """Mock TavilyClient for web search fallback."""
    mock_client = MagicMock()
    mock_client.search.return_value = {
        "answer": "Direct flights between Mumbai and Tokyo operated by ANA and Air India.",
        "results": [
            {
                "title": "Mumbai to Tokyo Flights",
                "content": "Roundtrip flights starting from $650.",
                "url": "https://example.com/flights",
            }
        ]
    }
    monkeypatch.setattr("tavily.TavilyClient", MagicMock(return_value=mock_client))
    return mock_client


@pytest.fixture
def golden_dna():
    """Fixed cross-language golden Logistics DNA object."""
    return {
        "constraints": {
            "accessibility": ["wheelchair"],
            "dietary": "vegetarian",
            "home_hub": "BOM",
            "travel_pace": "moderate",
        },
        "metadata": {
            "last_login": "2026-11-22T00:00:00.000Z",
            "version": "v2.0",
        },
        "user_id": "usr_test_golden_12345",
        "weights": {
            "flight_class": {
                "business": 0.0,
                "economy": 1.0,
                "first": 0.0,
                "premium_economy": 0.0,
            },
            "interests": ["culture", "food"],
            "stay_tier": {
                "budget": 0.0,
                "luxury": 0.0,
                "mid_range": 1.0,
                "resort": 0.0,
            },
        },
    }


@pytest.fixture
def golden_secret():
    """Fixed test-only shared secret for cross-language golden HMAC tests."""
    return "test-golden-secret-key-32-chars-ok"


@pytest.fixture
def golden_expected_hmac():
    """Expected HMAC-SHA256 hex digest for golden_dna + golden_secret."""
    return "066de3402c7c48b414b5e9043c79494ce0955a9a605fe5ec5b97ddc8f5092d76"
