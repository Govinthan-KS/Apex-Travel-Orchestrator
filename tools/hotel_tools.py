import requests
from langchain.tools import tool
from rapidfuzz import process, fuzz
from config import OPENTRIPMAP_API_KEY, MAX_RESULTS

# This is our 'Black Market' of hotel data. 
# Since real APIs want a credit card and I don't want to add any more charges on top of my student debt, we use this.
MOCK_HOTELS = {
    "tokyo": [
        {"name": "Sakura Budget Inn", "price": 75, "rating": 4.1, "area": "Asakusa"},
        {"name": "Ueno Comfort Stay", "price": 110, "rating": 4.2, "area": "Ueno"},
        {"name": "Shinjuku Grand Hotel", "price": 180, "rating": 4.4, "area": "Shinjuku"},
        {"name": "Ginza Premium Suites", "price": 240, "rating": 4.6, "area": "Ginza"},
        {"name": "Imperial Tokyo Palace", "price": 420, "rating": 4.8, "area": "Chiyoda"}
    ],
    "new york": [
        {"name": "Budget Stay NYC", "price": 95, "rating": 4.0, "area": "Queens"},
        {"name": "Brooklyn Comfort Inn", "price": 130, "rating": 4.1, "area": "Brooklyn"},
        {"name": "Manhattan Central Hotel", "price": 220, "rating": 4.3, "area": "Manhattan"},
        {"name": "Hudson Premium Suites", "price": 260, "rating": 4.5, "area": "Chelsea"},
        {"name": "The Grand Plaza NY", "price": 550, "rating": 4.7, "area": "Midtown"}
    ],
    "london": [
        {"name": "London Budget Rooms", "price": 85, "rating": 4.1, "area": "Camden"},
        {"name": "Paddington Comfort Inn", "price": 140, "rating": 4.2, "area": "Paddington"},
        {"name": "Thames View Hotel", "price": 200, "rating": 4.5, "area": "South Bank"},
        {"name": "Soho Premium Suites", "price": 250, "rating": 4.6, "area": "Soho"},
        {"name": "Royal Kensington Palace Hotel", "price": 480, "rating": 4.8, "area": "Kensington"}
    ],
    "paris": [
        {"name": "Paris Cozy Inn", "price": 90, "rating": 4.2, "area": "Montmartre"},
        {"name": "Bastille Comfort Hotel", "price": 140, "rating": 4.3, "area": "Bastille"},
        {"name": "Seine Riverside Hotel", "price": 210, "rating": 4.4, "area": "Latin Quarter"},
        {"name": "Louvre Premium Suites", "price": 260, "rating": 4.6, "area": "Louvre"},
        {"name": "Le Grand Luxe Paris", "price": 500, "rating": 4.9, "area": "Champs-Élysées"}
    ],
    "dubai": [
        {"name": "Desert Budget Stay", "price": 80, "rating": 4.0, "area": "Deira"},
        {"name": "Al Barsha Comfort Inn", "price": 120, "rating": 4.2, "area": "Al Barsha"},
        {"name": "Marina View Hotel", "price": 190, "rating": 4.3, "area": "Dubai Marina"},
        {"name": "Palm Premium Suites", "price": 280, "rating": 4.6, "area": "Palm Jumeirah"},
        {"name": "Burj Elite Resort", "price": 600, "rating": 4.9, "area": "Downtown Dubai"}
    ],
    "singapore": [
        {"name": "Lion City Budget Inn", "price": 95, "rating": 4.1, "area": "Little India"},
        {"name": "Bugis Comfort Stay", "price": 140, "rating": 4.3, "area": "Bugis"},
        {"name": "Orchard Central Hotel", "price": 230, "rating": 4.5, "area": "Orchard Road"},
        {"name": "Sentosa Premium Suites", "price": 270, "rating": 4.6, "area": "Sentosa"},
        {"name": "Marina Bay Luxury Suites", "price": 520, "rating": 4.8, "area": "Marina Bay"}
    ],
    "mumbai": [
        {"name": "Mumbai Budget Lodge", "price": 60, "rating": 4.0, "area": "Dadar"},
        {"name": "Andheri Comfort Inn", "price": 100, "rating": 4.2, "area": "Andheri"},
        {"name": "Gateway Comfort Hotel", "price": 150, "rating": 4.3, "area": "Colaba"},
        {"name": "Bandra Premium Suites", "price": 220, "rating": 4.5, "area": "Bandra"},
        {"name": "Taj Grand Palace Mumbai", "price": 400, "rating": 4.8, "area": "Apollo Bunder"}
    ],
    "chennai": [
        {"name": "Chennai Budget Stay", "price": 50, "rating": 4.1, "area": "T. Nagar"},
        {"name": "Adyar Comfort Inn", "price": 90, "rating": 4.2, "area": "Adyar"},
        {"name": "Marina Beach Hotel", "price": 140, "rating": 4.4, "area": "Mylapore"},
        {"name": "OMR Premium Suites", "price": 200, "rating": 4.5, "area": "OMR"},
        {"name": "Chola Luxury Palace", "price": 320, "rating": 4.7, "area": "Guindy"}
    ],
    "sydney": [
        {"name": "Sydney Budget Inn", "price": 90, "rating": 4.2, "area": "Haymarket"},
        {"name": "Parramatta Comfort Stay", "price": 140, "rating": 4.3, "area": "Parramatta"},
        {"name": "Harbour View Hotel", "price": 210, "rating": 4.5, "area": "Circular Quay"},
        {"name": "Bondi Premium Suites", "price": 260, "rating": 4.6, "area": "Bondi"},
        {"name": "Opera House Grand Suites", "price": 550, "rating": 4.9, "area": "The Rocks"}
    ],
    "rome": [
        {"name": "Rome Budget Rooms", "price": 85, "rating": 4.1, "area": "Trastevere"},
        {"name": "Vatican Comfort Inn", "price": 130, "rating": 4.2, "area": "Vatican"},
        {"name": "Colosseum Comfort Hotel", "price": 180, "rating": 4.4, "area": "Centro Storico"},
        {"name": "Trevi Premium Suites", "price": 240, "rating": 4.6, "area": "Trevi"},
        {"name": "Imperial Rome Luxury Suites", "price": 450, "rating": 4.8, "area": "Via Veneto"}
    ],
    "berlin": [
        {"name": "Berlin Budget Stay", "price": 80, "rating": 4.1, "area": "Kreuzberg"},
        {"name": "Alexanderplatz Comfort", "price": 120, "rating": 4.2, "area": "Mitte"},
        {"name": "Berlin Central Hotel", "price": 190, "rating": 4.4, "area": "Mitte"},
        {"name": "Charlottenburg Premium", "price": 240, "rating": 4.6, "area": "Charlottenburg"},
        {"name": "Berlin Royal Suites", "price": 380, "rating": 4.8, "area": "Tiergarten"}
    ],
    "toronto": [
        {"name": "Toronto Budget Inn", "price": 85, "rating": 4.1, "area": "Scarborough"},
        {"name": "Downtown Comfort Stay", "price": 140, "rating": 4.3, "area": "Downtown"},
        {"name": "CN Tower View Hotel", "price": 200, "rating": 4.5, "area": "Entertainment District"},
        {"name": "Harbourfront Premium", "price": 260, "rating": 4.6, "area": "Harbourfront"},
        {"name": "Toronto Grand Luxury", "price": 420, "rating": 4.8, "area": "Yorkville"}
    ],
    "bangkok": [
        {"name": "Bangkok Budget Stay", "price": 50, "rating": 4.0, "area": "Khao San"},
        {"name": "Sukhumvit Comfort Inn", "price": 100, "rating": 4.2, "area": "Sukhumvit"},
        {"name": "Bangkok City Hotel", "price": 150, "rating": 4.3, "area": "Silom"},
        {"name": "Riverside Premium Suites", "price": 220, "rating": 4.5, "area": "Chao Phraya"},
        {"name": "Bangkok Royal Palace Hotel", "price": 350, "rating": 4.7, "area": "Old City"}
    ],
    "barcelona": [
        {"name": "Barcelona Budget Inn", "price": 85, "rating": 4.1, "area": "El Raval"},
        {"name": "Gothic Comfort Hotel", "price": 130, "rating": 4.3, "area": "Gothic Quarter"},
        {"name": "La Rambla Central Hotel", "price": 190, "rating": 4.5, "area": "La Rambla"},
        {"name": "Eixample Premium Suites", "price": 250, "rating": 4.6, "area": "Eixample"},
        {"name": "Barcelona Grand Luxury", "price": 420, "rating": 4.8, "area": "Barceloneta"}
    ],
    "los angeles": [
        {"name": "LA Budget Stay", "price": 95, "rating": 4.0, "area": "Hollywood"},
        {"name": "Sunset Comfort Inn", "price": 140, "rating": 4.2, "area": "West Hollywood"},
        {"name": "Downtown LA Hotel", "price": 210, "rating": 4.4, "area": "Downtown"},
        {"name": "Beverly Hills Premium", "price": 280, "rating": 4.6, "area": "Beverly Hills"},
        {"name": "LA Grand Luxury Suites", "price": 520, "rating": 4.9, "area": "Santa Monica"}
    ]
}

# Mapping weather codes to English so the AI doesn't have to learn Meteorologist-speak
WEATHER_CODE_MAP = {0: "clear sky", 3: "overcast", 65: "heavy rain", 95: "thunderstorm"}

@tool
def search_hotels(city: str, budget_per_night: float = None, check_in_date: str = None) -> str:
    """
    Search for available hotels in a specific city based on a maximum budget per night and a check-in date.

    Args:
        city (str): The name of the destination city (e.g., 'Tokyo').
        budget_per_night (float): The maximum price the user is willing to pay per night in USD.
        check_in_date (str): The date of arrival in 'YYYY-MM-DD' format.

    Returns:
        str: A formatted list of hotels including name, price, rating, and area, 
             accompanied by a brief weather forecast for that location and date.
             If no hotels are found or the city is unsupported, an error message is returned.
    """
    # Cleaning the city name like we're scrubbing a dirty window
    city = city.strip().replace("\n", "").replace("\r", "")

    # If the LLM sends one giant string, we perform surgery to separate the parts.
    if budget_per_night is None and "," in city:
        # Splitting the chaos into three neat little piles
        parts = [p.strip().replace('"', '') for p in city.split(',')]
        if len(parts) >= 3:
            city = parts[0]
            try:
                # Attempting to turn a string into a number without causing a fire
                budget_per_night = float(parts[1])
            except ValueError:
                budget_per_night = 100.0 # Default to 100 because we aren't psychics
            check_in_date = parts[2]

    # Fuzzy matching to terminate typos and misspellings. Because let's be honest, who can spell 'Kolkata' right on the first try?
    city_clean = city.strip().lower()
    match = process.extractOne(city_clean, MOCK_HOTELS.keys(), scorer=fuzz.WRatio)
    
    # If the match is worse than a 75%, we tell the user to check a map.
    if not match or match[1] < 75:
        return f"Error: '{city}' is not in our database. We currently support: {', '.join(MOCK_HOTELS.keys())}."
    
    matched_city = match[0]
    
    # Budget filtering
    # Finding hotels that don't cost more than the user's entire net worth.
    filtered = [h for h in MOCK_HOTELS[matched_city] if h["price"] <= budget_per_night]
    
    if not filtered:
        return f"No hotels in {matched_city.title()} under ${budget_per_night}. Maybe try a hostel or a very nice bench?"

    # Weather fetching (The 'SHOULD I BRING AN UMBRELLA' check)
    # We use Open-Meteo because they are the only ones who don't want our credit card info (they already know about my negative balance).
    weather_report = "Weather data unavailable (the satellites are probably napping)."
    try:
        # First, we find the coordinates so we know where on Earth we are looking.
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={matched_city}&count=1"
        geo_res = requests.get(geo_url, timeout=5).json()
        
        if "results" in geo_res:
            lat = geo_res["results"][0]["latitude"]
            lon = geo_res["results"][0]["longitude"]
            
            # Now we ask the weather gods for the forecast.
            w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=weathercode&timezone=auto"
            w_res = requests.get(w_url, timeout=5).json()
            code = w_res["daily"]["weathercode"][0]
            condition = WEATHER_CODE_MAP.get(code, "mysterious weather")
            weather_report = f"Forecast: {condition.title()} (Dress accordingly!)."
    except:
        pass # If the weather fails, we just keep it moving. No drama.

    # Formatting the final truth
    output = [f"Found these gems in {matched_city.title()}:", weather_report, "---"]
    for h in filtered:
        output.append(f"- {h['name']} (${h['price']}/night) | Rating: {h['rating']} | Area: {h['area']}")
    
    return "\n".join(output)