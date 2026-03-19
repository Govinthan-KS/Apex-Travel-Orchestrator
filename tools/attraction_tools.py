import requests
from langchain.tools import tool
from config import OPENTRIPMAP_API_KEY, MAX_RESULTS

def get_coordinates(city_name: str):
    """
    Converts a city name into coordinates, now with extra 'Spam-Filter' power.
    """
    # We strip out newlines (\n), tabs (\t), and extra spaces 
    # that the LLM might have accidentally sneaked in.
    clean_city = city_name.strip().replace("\n", "").replace("\r", "")
    
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_city}&count=1&language=en&format=json"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if "results" in data:
            lat = data["results"][0]["latitude"]
            lon = data["results"][0]["longitude"]
            return lat, lon
    except Exception:
        pass
    return None, None

@tool
def search_attractions(city: str) -> str:
    """
    Searches for points of interest, monuments, and tourist attractions in a specific city.

    Args:
        city (str): The name of the city to explore (e.g., 'Paris').

    Returns:
        str: A newline-separated list of attraction names and their categories.
             Returns an error message if the city cannot be located or no attractions are found.
    """
    
    # Step 1: Turn the human word into robot numbers (Lat/Lon)
    # We can't find the 'Eiffel Tower' if we don't know where 'Paris' is on a grid.
    lat, lon = get_coordinates(city)
    
    if lat is None or lon is None:
        return f"Error: I couldn't find '{city}' on the map. Is it a secret city? A floating island?"

    # Step 2: Bother the OpenTripMap API for the actual goodies.
    # We are looking for 'interesting_places' within 5000 meters of the center.
    url = "https://api.opentripmap.com/0.1/en/places/radius"
    params = {
        "apikey": OPENTRIPMAP_API_KEY,
        "radius": 5000, # 5km radius because we aren't marathon runners
        "lon": lon,
        "lat": lat,
        "format": "json",
        "limit": MAX_RESULTS
    }

    try:
        # Sending the request to the 'Local Guide'
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if not data:
            return f"No attractions found in {city}. Maybe it's a very peaceful, empty field?"

        # Turning the JSON list into something that doesn't look like a computer threw up.
        attractions = [f"🏛️ Top sights in {city.title()}:"]
        for place in data:
            name = place.get("name", "Mysterious Landmark")
            # If the place has no name, it's probably not worth the bus fare.
            if name:
                # Cleaning up the categories so they don't look like 'architecture,monument,cool_stuff'
                kinds = place.get("kinds", "various").replace("_", " ").split(",")[0]
                attractions.append(f"- {name} ({kinds.title()})")

        return "\n".join(attractions)

    except Exception as e:
        # If the API explodes, we blame the wifi and move on.
        return f"Attraction Tool Meltdown: {str(e)}. Please restart the universe."
    
# Testing area to make sure our tool isn't just a pretty face.
if __name__ == "__main__":
    # We are testing if it can find cool stuff in Chennai
    test_city = "Chennai"
    print(f"--- Searching for cool stuff in {test_city} ---")
    print(search_attractions(test_city))