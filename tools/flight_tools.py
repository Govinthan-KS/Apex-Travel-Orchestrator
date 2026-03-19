import requests
from langchain.tools import tool
from rapidfuzz import process, fuzz
from config import AVIATIONSTACK_API_KEY, MAX_RESULTS

# The 'Forbidden Scroll of Geography'
# Mapping human words to the 3-letter codes airports use to confuse us.
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
    "sydney": "SYD"
}

def get_iata_code(city_name: str) -> str:
    """
    Matches a city name to its corresponding 3-letter IATA airport code.

    Args:
        city_name (str): The name of the city to resolve.

    Returns:
        str: The IATA code (e.g., 'JFK') if a match is found; otherwise, None.
    """
    # If the LLM sent us nothing, we return nothing. No drama.
    if not city_name:
        return None

    # Stripping whitespace like we're peeling a very dusty potato
    city_clean = str(city_name).strip().lower()
    
    # If the user actually typed it right, we celebrate with a tiny digital party.
    if city_clean in CITY_TO_IATA:
        return CITY_TO_IATA[city_clean]
    
    # RapidFuzz helps us deal with 'Dehli' or 'Banglore' without crying.
    match = process.extractOne(city_clean, CITY_TO_IATA.keys(), scorer=fuzz.WRatio)
    if match and match[1] >= 75:
        return CITY_TO_IATA[match[0]]
    
    return None

@tool
def search_flights(departure_city: str, arrival_city: str = None, flight_date: str = None) -> str:
    """
    Searches for available flight schedules between two cities on a given date using the Aviationstack API.

    Args:
        departure_city (str): The name of the origin city (e.g., 'Chennai').
        arrival_city (str): The name of the destination city (e.g., 'Tokyo').
        flight_date (str): The departure date in 'YYYY-MM-DD' format.

    Returns:
        str: A newline-separated list of flight options including airline, flight number, 
             and status, or a descriptive error message if no flights or cities are found.
    """
    
    # Sometimes the LLM stuffs everything into the first argument like a messy suitcase.
    if arrival_city is None and departure_city and "," in departure_city:
        parts = [p.strip().replace('"', '') for p in departure_city.split(",")]
        if len(parts) >= 3:
            departure_city = parts[0]
            arrival_city = parts[1]
            flight_date = parts[2]

    # Safeguard for type 'None'
    # If one of these is still None, we stop the execution before it hits the .strip() fan.
    if not departure_city or not arrival_city:
        return "Error: I need both a Departure City and an Arrival City. I'm a pilot, not a mind-reader!"

    # Sanitizing the input so we don't pass weird newlines to the API
    departure_city = str(departure_city).strip().replace("\n", "")
    arrival_city = str(arrival_city).strip().replace("\n", "")

    # Turning 'Chennai' into 'MAA' so the API doesn't hang up on us.
    dep_code = get_iata_code(departure_city)
    arr_code = get_iata_code(arrival_city)

    # If the codes are missing, we admit we failed Geography 101.
    if not dep_code or not arr_code:
        return (f"Error: Could not find codes for '{departure_city}' or '{arrival_city}'. "
                f"Supported cities: {', '.join(CITY_TO_IATA.keys())}")

    # Preparing the digital carrier pigeon for the Aviationstack API.
    url = "http://api.aviationstack.com/v1/flights"
    params = {
        "access_key": AVIATIONSTACK_API_KEY,
        "dep_iata": dep_code,
        "arr_iata": arr_code,
        "limit": MAX_RESULTS
    }

    try:
        # Poking the API and hoping it's in a good mood.
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        # Checking if the API gave us data or just a cold, blank stare.
        if "data" not in data or not data["data"]:
            return f"No flights found from {dep_code} to {arr_code}. Maybe buy a boat?"

        # Formatting the JSON garbage into something a human can actually read.
        flight_results = [f"Flights from {departure_city.title()} to {arrival_city.title()}:"]
        
        for flight in data["data"]:
            airline = flight["airline"]["name"]
            f_num = flight["flight"]["number"]
            status = flight["flight_status"]
            
            # Since the free tier is 'budget-friendly', we estimate the fare.
            flight_results.append(
                f"- {airline} #{f_num} | Status: {status.title()} | Est. Fare: $500-$900"
            )

        return "\n".join(flight_results)

    except Exception as e:
        # If it crashes, we blame the internet (and this error message).
        return f"Flight tool explosion: {str(e)}. Send coffee."