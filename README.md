# Travel Planner System

A hierarchical, multi-agent AI travel planning system built with LangChain and Groq. 

This project uses a **Manager-Worker architecture**. A central **Coordinator Agent (CEO)** manages the high-level plan and delegates tasks to specialized sub-agents. Each sub-agent runs its own ReAct loop to ensure data is processed correctly before reporting back to the Coordinator for the final synthesis.

## How It Works

The system is split into three specialized departments:

1. **Coordinator Agent (The CEO):** The main brain that receives the user request. It tracks the total budget and trip duration, calls the specialists in order, and builds the final day-by-day itinerary.
2. **Flight Specialist:** Dedicated to extracting routes and dates to find flight schedules via the Aviationstack API.
3. **Hotel Specialist (Gary):** Handles accommodation searches within the user's budget and provides local weather context.
4. **Attraction Specialist:** Finds cultural landmarks and top sights using the OpenTripMap API.

## Tech Stack

- **Framework:** LangChain (AgentExecutors & Custom Tools)
- **LLM:** Groq (Llama 3.3 70b)
- **APIs:** Aviationstack, OpenTripMap, Open-Meteo
- **Environment:** Python 3.12+

## Setup & Installation

Follow these steps to get the system running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Govinthan-KS/Travel-Planner-System
cd travel-planner-system
```
### 2. Set Up a Virtual Environment
It is highly recommended to use a virtual environment to avoid dependency conflicts.

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```
**On Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a file named .env in the root directory and add your API keys. Note: Do not share this file or push it to GitHub.
Check the .env.example file to refer the format

### 5. Run the Project
```bash
python main.py
```

### Project Structure
**agents/:** Logic for the Coordinator and specialized sub-agents.

**tools/:** Python functions that interface with external APIs.

**config.py:** Central configuration for API keys and model settings.

**main.py:** The entry point for the command-line interface.

**.env.example:** A template file showing the required environment variables

**requirements.txt:** Contains a list of all the required libraries along with the specific version

## License
MIT