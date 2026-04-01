"""
Apex Travel Orchestrator v2 — Hotel Tools (DNA-Aware)
======================================================

Upgraded from V1:
  - stay_tier parameter: filters MOCK_HOTELS by tier (budget/mid_range/luxury/resort)
  - Tier-aware budget ranges applied automatically
  - Still uses MOCK_HOTELS dict (real API integration is a future upgrade)
"""

import requests
from langchain.tools import tool
from rapidfuzz import process, fuzz
from config import OPENTRIPMAP_API_KEY, MAX_RESULTS

# ──────────────────────────────────────────────────────────────
# Mock Hotel Database (same data, now with tier classification)
# ──────────────────────────────────────────────────────────────

# Tier classification by price range:
#   budget    → $0 - $100
#   mid_range → $100 - $250
#   luxury    → $250 - $450
#   resort    → $450+

MOCK_HOTELS = {
    "tokyo": [
        {"name": "Sakura Budget Inn", "price": 75, "rating": 4.1, "area": "Asakusa", "tier": "budget"},
        {"name": "Ueno Comfort Stay", "price": 110, "rating": 4.2, "area": "Ueno", "tier": "mid_range"},
        {"name": "Shinjuku Grand Hotel", "price": 180, "rating": 4.4, "area": "Shinjuku", "tier": "mid_range"},
        {"name": "Ginza Premium Suites", "price": 240, "rating": 4.6, "area": "Ginza", "tier": "mid_range"},
        {"name": "Imperial Tokyo Palace", "price": 420, "rating": 4.8, "area": "Chiyoda", "tier": "luxury"},
    ],
    "new york": [
        {"name": "Budget Stay NYC", "price": 95, "rating": 4.0, "area": "Queens", "tier": "budget"},
        {"name": "Brooklyn Comfort Inn", "price": 130, "rating": 4.1, "area": "Brooklyn", "tier": "mid_range"},
        {"name": "Manhattan Central Hotel", "price": 220, "rating": 4.3, "area": "Manhattan", "tier": "mid_range"},
        {"name": "Hudson Premium Suites", "price": 260, "rating": 4.5, "area": "Chelsea", "tier": "luxury"},
        {"name": "The Grand Plaza NY", "price": 550, "rating": 4.7, "area": "Midtown", "tier": "resort"},
    ],
    "london": [
        {"name": "London Budget Rooms", "price": 85, "rating": 4.1, "area": "Camden", "tier": "budget"},
        {"name": "Paddington Comfort Inn", "price": 140, "rating": 4.2, "area": "Paddington", "tier": "mid_range"},
        {"name": "Thames View Hotel", "price": 200, "rating": 4.5, "area": "South Bank", "tier": "mid_range"},
        {"name": "Soho Premium Suites", "price": 250, "rating": 4.6, "area": "Soho", "tier": "luxury"},
        {"name": "Royal Kensington Palace Hotel", "price": 480, "rating": 4.8, "area": "Kensington", "tier": "resort"},
    ],
    "paris": [
        {"name": "Paris Cozy Inn", "price": 90, "rating": 4.2, "area": "Montmartre", "tier": "budget"},
        {"name": "Bastille Comfort Hotel", "price": 140, "rating": 4.3, "area": "Bastille", "tier": "mid_range"},
        {"name": "Seine Riverside Hotel", "price": 210, "rating": 4.4, "area": "Latin Quarter", "tier": "mid_range"},
        {"name": "Louvre Premium Suites", "price": 260, "rating": 4.6, "area": "Louvre", "tier": "luxury"},
        {"name": "Le Grand Luxe Paris", "price": 500, "rating": 4.9, "area": "Champs-Elysees", "tier": "resort"},
    ],
    "dubai": [
        {"name": "Desert Budget Stay", "price": 80, "rating": 4.0, "area": "Deira", "tier": "budget"},
        {"name": "Al Barsha Comfort Inn", "price": 120, "rating": 4.2, "area": "Al Barsha", "tier": "mid_range"},
        {"name": "Marina View Hotel", "price": 190, "rating": 4.3, "area": "Dubai Marina", "tier": "mid_range"},
        {"name": "Palm Premium Suites", "price": 280, "rating": 4.6, "area": "Palm Jumeirah", "tier": "luxury"},
        {"name": "Burj Elite Resort", "price": 600, "rating": 4.9, "area": "Downtown Dubai", "tier": "resort"},
    ],
    "singapore": [
        {"name": "Lion City Budget Inn", "price": 95, "rating": 4.1, "area": "Little India", "tier": "budget"},
        {"name": "Bugis Comfort Stay", "price": 140, "rating": 4.3, "area": "Bugis", "tier": "mid_range"},
        {"name": "Orchard Central Hotel", "price": 230, "rating": 4.5, "area": "Orchard Road", "tier": "mid_range"},
        {"name": "Sentosa Premium Suites", "price": 270, "rating": 4.6, "area": "Sentosa", "tier": "luxury"},
        {"name": "Marina Bay Luxury Suites", "price": 520, "rating": 4.8, "area": "Marina Bay", "tier": "resort"},
    ],
    "mumbai": [
        {"name": "Mumbai Budget Lodge", "price": 60, "rating": 4.0, "area": "Dadar", "tier": "budget"},
        {"name": "Andheri Comfort Inn", "price": 100, "rating": 4.2, "area": "Andheri", "tier": "mid_range"},
        {"name": "Gateway Comfort Hotel", "price": 150, "rating": 4.3, "area": "Colaba", "tier": "mid_range"},
        {"name": "Bandra Premium Suites", "price": 220, "rating": 4.5, "area": "Bandra", "tier": "mid_range"},
        {"name": "Taj Grand Palace Mumbai", "price": 400, "rating": 4.8, "area": "Apollo Bunder", "tier": "luxury"},
    ],
    "chennai": [
        {"name": "Chennai Budget Stay", "price": 50, "rating": 4.1, "area": "T. Nagar", "tier": "budget"},
        {"name": "Adyar Comfort Inn", "price": 90, "rating": 4.2, "area": "Adyar", "tier": "budget"},
        {"name": "Marina Beach Hotel", "price": 140, "rating": 4.4, "area": "Mylapore", "tier": "mid_range"},
        {"name": "OMR Premium Suites", "price": 200, "rating": 4.5, "area": "OMR", "tier": "mid_range"},
        {"name": "Chola Luxury Palace", "price": 320, "rating": 4.7, "area": "Guindy", "tier": "luxury"},
    ],
    "sydney": [
        {"name": "Sydney Budget Inn", "price": 90, "rating": 4.2, "area": "Haymarket", "tier": "budget"},
        {"name": "Parramatta Comfort Stay", "price": 140, "rating": 4.3, "area": "Parramatta", "tier": "mid_range"},
        {"name": "Harbour View Hotel", "price": 210, "rating": 4.5, "area": "Circular Quay", "tier": "mid_range"},
        {"name": "Bondi Premium Suites", "price": 260, "rating": 4.6, "area": "Bondi", "tier": "luxury"},
        {"name": "Opera House Grand Suites", "price": 550, "rating": 4.9, "area": "The Rocks", "tier": "resort"},
    ],
    "rome": [
        {"name": "Rome Budget Rooms", "price": 85, "rating": 4.1, "area": "Trastevere", "tier": "budget"},
        {"name": "Vatican Comfort Inn", "price": 130, "rating": 4.2, "area": "Vatican", "tier": "mid_range"},
        {"name": "Colosseum Comfort Hotel", "price": 180, "rating": 4.4, "area": "Centro Storico", "tier": "mid_range"},
        {"name": "Trevi Premium Suites", "price": 240, "rating": 4.6, "area": "Trevi", "tier": "luxury"},
        {"name": "Imperial Rome Luxury Suites", "price": 450, "rating": 4.8, "area": "Via Veneto", "tier": "resort"},
    ],
    "berlin": [
        {"name": "Berlin Budget Stay", "price": 80, "rating": 4.1, "area": "Kreuzberg", "tier": "budget"},
        {"name": "Alexanderplatz Comfort", "price": 120, "rating": 4.2, "area": "Mitte", "tier": "mid_range"},
        {"name": "Berlin Central Hotel", "price": 190, "rating": 4.4, "area": "Mitte", "tier": "mid_range"},
        {"name": "Charlottenburg Premium", "price": 240, "rating": 4.6, "area": "Charlottenburg", "tier": "luxury"},
        {"name": "Berlin Royal Suites", "price": 380, "rating": 4.8, "area": "Tiergarten", "tier": "luxury"},
    ],
    "toronto": [
        {"name": "Toronto Budget Inn", "price": 85, "rating": 4.1, "area": "Scarborough", "tier": "budget"},
        {"name": "Downtown Comfort Stay", "price": 140, "rating": 4.3, "area": "Downtown", "tier": "mid_range"},
        {"name": "CN Tower View Hotel", "price": 200, "rating": 4.5, "area": "Entertainment District", "tier": "mid_range"},
        {"name": "Harbourfront Premium", "price": 260, "rating": 4.6, "area": "Harbourfront", "tier": "luxury"},
        {"name": "Toronto Grand Luxury", "price": 420, "rating": 4.8, "area": "Yorkville", "tier": "luxury"},
    ],
    "bangkok": [
        {"name": "Bangkok Budget Stay", "price": 50, "rating": 4.0, "area": "Khao San", "tier": "budget"},
        {"name": "Sukhumvit Comfort Inn", "price": 100, "rating": 4.2, "area": "Sukhumvit", "tier": "mid_range"},
        {"name": "Bangkok City Hotel", "price": 150, "rating": 4.3, "area": "Silom", "tier": "mid_range"},
        {"name": "Riverside Premium Suites", "price": 220, "rating": 4.5, "area": "Chao Phraya", "tier": "mid_range"},
        {"name": "Bangkok Royal Palace Hotel", "price": 350, "rating": 4.7, "area": "Old City", "tier": "luxury"},
    ],
    "barcelona": [
        {"name": "Barcelona Budget Inn", "price": 85, "rating": 4.1, "area": "El Raval", "tier": "budget"},
        {"name": "Gothic Comfort Hotel", "price": 130, "rating": 4.3, "area": "Gothic Quarter", "tier": "mid_range"},
        {"name": "La Rambla Central Hotel", "price": 190, "rating": 4.5, "area": "La Rambla", "tier": "mid_range"},
        {"name": "Eixample Premium Suites", "price": 250, "rating": 4.6, "area": "Eixample", "tier": "luxury"},
        {"name": "Barcelona Grand Luxury", "price": 420, "rating": 4.8, "area": "Barceloneta", "tier": "luxury"},
    ],
    "los angeles": [
        {"name": "LA Budget Stay", "price": 95, "rating": 4.0, "area": "Hollywood", "tier": "budget"},
        {"name": "Sunset Comfort Inn", "price": 140, "rating": 4.2, "area": "West Hollywood", "tier": "mid_range"},
        {"name": "Downtown LA Hotel", "price": 210, "rating": 4.4, "area": "Downtown", "tier": "mid_range"},
        {"name": "Beverly Hills Premium", "price": 280, "rating": 4.6, "area": "Beverly Hills", "tier": "luxury"},
        {"name": "LA Grand Luxury Suites", "price": 520, "rating": 4.9, "area": "Santa Monica", "tier": "resort"},
    ],
}

# Weather code mapping
WEATHER_CODE_MAP = {0: "clear sky", 3: "overcast", 65: "heavy rain", 95: "thunderstorm"}

# Tier display names
TIER_LABELS = {
    "budget": "Budget",
    "mid_range": "Mid-Range",
    "luxury": "Luxury",
    "resort": "Resort/Premium",
}


@tool
def search_hotels(
    city: str,
    budget_per_night: float = None,
    check_in_date: str = None,
    stay_tier: str = None,
) -> str:
    """
    Search for hotels with V2 tier-based filtering from user DNA.

    Args:
        city (str): Destination city name.
        budget_per_night (float): Max price per night in USD.
        check_in_date (str): Arrival date in 'YYYY-MM-DD' format.
        stay_tier (str): User's preferred tier: 'budget', 'mid_range', 'luxury', or 'resort'.

    Returns:
        str: Formatted hotel list filtered by budget AND tier, with weather forecast.
    """
    # Clean city input
    city = city.strip().replace("\n", "").replace("\r", "")

    # Handle LLM sending everything as a single comma-separated string
    if budget_per_night is None and "," in city:
        parts = [p.strip().replace('"', '') for p in city.split(',')]
        if len(parts) >= 3:
            city = parts[0]
            try:
                budget_per_night = float(parts[1])
            except ValueError:
                budget_per_night = 200.0
            check_in_date = parts[2]
            # V2: Parse the 4th parameter as stay_tier
            if len(parts) >= 4:
                tier_input = parts[3].strip().lower().replace("-", "_").replace(" ", "_")
                if tier_input in TIER_LABELS:
                    stay_tier = tier_input

    # Default budget if still None
    if budget_per_night is None:
        budget_per_night = 200.0

    # Default tier if still None
    if stay_tier is None:
        stay_tier = "mid_range"

    # Normalize tier input
    stay_tier = stay_tier.strip().lower().replace("-", "_").replace(" ", "_")
    if stay_tier not in TIER_LABELS:
        stay_tier = "mid_range"

    # Fuzzy city matching
    city_clean = city.strip().lower()
    match = process.extractOne(city_clean, MOCK_HOTELS.keys(), scorer=fuzz.WRatio)

    if not match or match[1] < 75:
        return f"Error: '{city}' is not in our database. We support: {', '.join(MOCK_HOTELS.keys())}."

    matched_city = match[0]

    # ── V2: Tier-Based Filtering ──
    all_hotels = MOCK_HOTELS[matched_city]

    if stay_tier == "luxury" or stay_tier == "resort":
        # Luxury/Resort: only show hotels rated 4.5+ AND matching tier or above
        filtered = [
            h for h in all_hotels
            if h["rating"] >= 4.5
            and h["tier"] in ("luxury", "resort")
            and h["price"] <= budget_per_night
        ]
        # If budget is too low for luxury, show luxury options anyway but note it
        if not filtered:
            filtered = [h for h in all_hotels if h["tier"] in ("luxury", "resort")]
            if filtered:
                budget_note = f" (Note: These exceed the ${budget_per_night}/night budget but match the '{TIER_LABELS[stay_tier]}' tier preference.)"
            else:
                return f"No {TIER_LABELS[stay_tier]} hotels found in {matched_city.title()}."
        else:
            budget_note = ""
    elif stay_tier == "budget":
        # Budget: cheapest options first
        filtered = [h for h in all_hotels if h["price"] <= budget_per_night and h["tier"] == "budget"]
        if not filtered:
            filtered = [h for h in all_hotels if h["price"] <= budget_per_night]
        budget_note = ""
    else:
        # Mid-Range (default): good balance of price and rating
        filtered = [h for h in all_hotels if h["price"] <= budget_per_night]
        budget_note = ""

    if not filtered:
        return f"No hotels in {matched_city.title()} under ${budget_per_night} for tier '{TIER_LABELS[stay_tier]}'."

    # Weather fetch
    weather_report = "Weather data unavailable."
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={matched_city}&count=1"
        geo_res = requests.get(geo_url, timeout=5).json()

        if "results" in geo_res:
            lat = geo_res["results"][0]["latitude"]
            lon = geo_res["results"][0]["longitude"]
            w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=weathercode&timezone=auto"
            w_res = requests.get(w_url, timeout=5).json()
            code = w_res["daily"]["weathercode"][0]
            condition = WEATHER_CODE_MAP.get(code, "variable conditions")
            weather_report = f"Forecast: {condition.title()}."
    except Exception:
        pass

    # Format output
    tier_display = TIER_LABELS.get(stay_tier, stay_tier)
    output = [
        f"Hotels in {matched_city.title()} (Tier: {tier_display}, Budget: ${budget_per_night}/night):",
        weather_report,
        "---",
    ]

    for h in filtered:
        tier_tag = f" [{TIER_LABELS.get(h['tier'], h['tier'])}]"
        output.append(
            f"- {h['name']} (${h['price']}/night) | Rating: {h['rating']} | Area: {h['area']}{tier_tag}"
        )

    if budget_note:
        output.append(budget_note)

    return "\n".join(output)