"""
Apex Travel Orchestrator v2 — Flight Tools (DNA-Aware + Tavily Fallback)
==========================================================================

Upgraded from V1:
  - Dynamic IATA resolution (city names + IATA codes)
  - Better handling of home_hub codes from DNA
  - Removed hardcoded 'Delhi' fallback

V2.1 — Tavily Web Search Fallback:
  - If AviationStack returns "No flights found," the agent can now fall
    back to web_search_flights which uses Tavily to search the web for
    flight routes, connection data, and estimated prices.

  Sending Tavily to the front lines because Aviation Stack is having a nap.
  It's like Googling for your life, but with more Python.
"""

import requests
import logging
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.tools import tool
from rapidfuzz import process, fuzz
from config import AVIATIONSTACK_API_KEY, TAVILY_API_KEY, MAX_RESULTS

logger = logging.getLogger(__name__)

class FlightSearchArgs(BaseModel):
    departure_city: str = Field(description="City name or IATA code for departure, e.g., 'MAA' or 'Chennai'")
    arrival_city: str = Field(description="City name or IATA code for arrival, e.g., 'NRT' or 'Tokyo'")
    flight_date: str = Field(description="Departure date in 'YYYY-MM-DD' format", default=None)

class WebSearchFlightsArgs(BaseModel):
    query: str = Field(description="A natural language search query for flights, e.g., 'flights from Chennai to Tokyo with connections and prices'")


# The city-to-IATA mapping (expanded from V1)
CITY_TO_IATA = {
    "chennai": "MAA",
    "tokyo": "NRT",
    "bangalore": "BLR",
    "london": "LHR",
    "new york": "JFK",
    "delhi": "DEL",
    "chandigarh": "IXC",
    "mumbai": "BOM",
    "dubai": "DXB",
    "singapore": "SIN",
    "paris": "CDG",
    "bangkok": "BKK",
    "sydney": "SYD",
    "rome": "FCO",
    "berlin": "BER",
    "toronto": "YYZ",
    "barcelona": "BCN",
    "los angeles": "LAX",
}

# Reverse mapping: IATA → city name (for display purposes)
IATA_TO_CITY = {v: k.title() for k, v in CITY_TO_IATA.items()}


def get_iata_code(city_name: str) -> str:
    """
    Resolve a city name OR an existing IATA code to a valid IATA code.

    V2 Enhancement: If the input is already a 3-letter uppercase code that
    we recognize, use it directly. This handles home_hub DNA values like "MAA"
    without requiring a reverse lookup.

    Args:
        city_name: City name (e.g., 'Chennai') or IATA code (e.g., 'MAA').

    Returns:
        The IATA code or None if unresolvable.
    """
    if not city_name:
        return None

    city_clean = str(city_name).strip()

    # V2: Check if it's already a valid IATA code (3 uppercase letters)
    if len(city_clean) == 3 and city_clean.isalpha():
        code_upper = city_clean.upper()
        # If it's in our known codes, use it directly
        if code_upper in IATA_TO_CITY:
            return code_upper
        # Even if unknown, treat 3-letter codes as IATA codes
        # (the API will validate them)
        return code_upper

    # Standard city name lookup
    city_lower = city_clean.lower()
    if city_lower in CITY_TO_IATA:
        return CITY_TO_IATA[city_lower]

    # Fuzzy match for typos
    match = process.extractOne(city_lower, CITY_TO_IATA.keys(), scorer=fuzz.WRatio)
    if match and match[1] >= 75:
        return CITY_TO_IATA[match[0]]

    return None


@tool(args_schema=FlightSearchArgs)
def search_flights(departure_city: str, arrival_city: str, flight_date: str = None) -> str:
    """
    Searches for available flight schedules between two cities using the Aviationstack API.

    V2: Now handles IATA codes directly (e.g., 'MAA') from the user's home_hub DNA,
    in addition to city names. Supports dynamic resolution.

    Args:
        departure_city (str): City name or IATA code (e.g., 'MAA' or 'Chennai').
        arrival_city (str): City name or IATA code (e.g., 'NRT' or 'Tokyo').
        flight_date (str): Departure date in 'YYYY-MM-DD' format.

    Returns:
        str: Formatted list of flight options or an error message.
    """
    # Handle LLM stuffing everything into a single comma-separated string
    if arrival_city is None and departure_city and "," in departure_city:
        parts = [p.strip().replace('"', '') for p in departure_city.split(",")]
        if len(parts) >= 3:
            departure_city = parts[0]
            arrival_city = parts[1]
            flight_date = parts[2]

    if not departure_city or not arrival_city:
        return "Error: I need both a Departure City and an Arrival City."

    # Sanitize
    departure_city = str(departure_city).strip().replace("\n", "")
    arrival_city = str(arrival_city).strip().replace("\n", "")

    # V2: Dynamic IATA resolution (handles both city names AND IATA codes)
    dep_code = get_iata_code(departure_city)
    arr_code = get_iata_code(arrival_city)

    if not dep_code or not arr_code:
        return (
            f"Error: Could not resolve '{departure_city}' or '{arrival_city}' to IATA codes. "
            f"Supported cities: {', '.join(CITY_TO_IATA.keys())}. "
            f"You can also pass 3-letter IATA codes directly (e.g., MAA, NRT, JFK)."
        )

    # Display names for output
    dep_display = IATA_TO_CITY.get(dep_code, departure_city.title())
    arr_display = IATA_TO_CITY.get(arr_code, arrival_city.title())

    url = "http://api.aviationstack.com/v1/flights"
    params = {
        "access_key": AVIATIONSTACK_API_KEY,
        "dep_iata": dep_code,
        "arr_iata": arr_code,
        "limit": MAX_RESULTS,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if "data" not in data or not data["data"]:
            return f"No flights found from {dep_display} ({dep_code}) to {arr_display} ({arr_code})."

        flight_results = [f"Flights from {dep_display} ({dep_code}) to {arr_display} ({arr_code}):"]

        for flight in data["data"]:
            airline = (flight.get("airline") or {}).get("name") or "Unknown Airline"
            f_num = (flight.get("flight") or {}).get("number") or "N/A"
            status = (flight.get("flight_status") or "scheduled").title()

            flight_results.append(
                f"- {airline} #{f_num} | Status: {status} | Est. Fare: $500-$900"
            )

        return "\n".join(flight_results)

    except Exception as e:
        return f"Flight tool error: {str(e)}"


# ──────────────────────────────────────────────────────────────
# Tavily Web Search Fallback
#
# Sending Tavily to the front lines because Aviation Stack is
# having a nap. It's like Googling for your life, but with
# more Python.
#
# This tool should ONLY be used if search_flights returns
# "No flights found." — the agent prompt enforces this.
# ──────────────────────────────────────────────────────────────

@tool(args_schema=WebSearchFlightsArgs)
def web_search_flights(query: str) -> str:
    """
    Fallback flight search using Tavily web search. Use this ONLY when search_flights
    returns 'No flights found'. Searches the web for flight routes, airlines,
    connection options, and estimated prices between cities.

    Args:
        query (str): A natural language search query like
                     'flights from Chennai to Tokyo with connections and prices'.

    Returns:
        str: Summarized flight route and pricing information from the web.
    """
    if not TAVILY_API_KEY:
        return (
            "Web search unavailable — TAVILY_API_KEY not configured. "
            "Provide a logical estimate based on your knowledge."
        )

    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=TAVILY_API_KEY)

        logger.info("Tavily fallback search: '%s'", query[:80])

        # Search with travel-focused context
        search_query = f"flights {query} airlines routes prices estimated cost 2026"
        response = client.search(
            query=search_query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )

        # Build a structured summary from Tavily results
        results = []

        # If Tavily provided a direct answer, lead with it
        if response.get("answer"):
            results.append(f"Web Search Summary: {response['answer']}")
            results.append("")

        # Add individual source results
        for item in response.get("results", [])[:5]:
            title = item.get("title", "Unknown Source")
            content = item.get("content", "")[:200]
            url = item.get("url", "")
            results.append(f"- [{title}] {content}...")
            if url:
                results.append(f"  Source: {url}")

        if not results:
            return (
                "Web search returned no results. Provide a logical estimate based on "
                "common routes and typical pricing for this city pair."
            )

        results.insert(0, "=== TAVILY WEB SEARCH RESULTS (Fallback) ===")
        results.append("")
        results.append(
            "Note: These are web-sourced estimates. Use them to provide the user "
            "a reasonable flight recommendation with approximate pricing."
        )

        return "\n".join(results)

    except ImportError:
        return (
            "Tavily package not installed. Run: pip install tavily-python. "
            "In the meantime, provide a logical estimate."
        )
    except Exception as e:
        logger.error("Tavily search error: %s", e)
        return (
            f"Web search error: {str(e)}. "
            f"Provide a logical estimate based on common routes for this city pair."
        )