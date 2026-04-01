# Apex Travel Orchestrator (v2)

A resilient, cloud-ready, multi-agent AI travel planning system. Apex Travel Orchestrator evolved from a simple Python CLI script into a comprehensive full-stack Next.js application powered by LangChain, FastAPI, and Vector Database Semantic Memory.

This system utilizes a Hierarchical Manager-Worker Architecture where a central Coordinator Agent (CEO) manages complex trip planning by delegating highly specific tasks to specialized sub-agents, strictly adhering to user 'DNA' constraints and parsing the results into a beautiful front-end PrimeReact Timeline.

---

## How It Works

1. **User Onboarding:** A new user logs in via Google OAuth and completes a multi-step survey. Their preferences (Budget, Dietary Constraints, Travel Pace, Accessibility needs, and Home Hub airport) are saved into MongoDB as their Core DNA.
2. **Dashboard Query:** The user enters a trip request (e.g., "3 days in Paris") into the Next.js frontend dashboard.
3. **DNA Session Retrieval:** The frontend fetches the user's DNA constraints from MongoDB and packages them alongside the query, creating an HMAC-signed secure payload.
4. **Pinecone Semantic Memory Check:** The FastAPI backend receives the payload and queries the Pinecone Vector DB using `sentence-transformers` to see if the user has documented past trips or "soft memories" that share a similar contextual "vibe."
5. **Agentic Orchestration:** The Coordinator Agent receives the user's query enriched with both their Hard DNA Constraints and Soft Memories. It isolates tasks and delegates them:
   - It sends the Flight Specialist to fetch flights originating exclusively from the user's Home Hub.
   - It sends the Hotel Specialist to query properties that map to the user's budget and tier-preferences.
   - It sends the Attraction Specialist to map out sightseeing constraints based on the user's active travel pace.
6. **ReAct Synthesis:** Each specialist returns a report. The Coordinator validates the total budget. If constraints are met, the Coordinator formats a strict JSON response.
7. **Frontend Timeline:** The Next.js client receives the JSON Array and dynamically renders a PrimeReact Timeline for the user, while saving the finalized itinerary into MongoDB under "Past Adventures" for future Vector DB indexing.

---

## Key Features (v2 Upgrades)

1. **Full-Stack Next.js Frontend:** A dynamic web app featuring multi-step onboarding, Google OAuth (NextAuth), interactive PrimeReact timelines, budget sliders, and responsive UI components. 
2. **MongoDB Session Persistence:** Secure user profiles tracking onboarding states, constraints, and storing a comprehensive history of planned trips.
3. **Pinecone Semantic Memory:** A Vector Database integration embedding and retrieving past itineraries. The system "learns" user preferences (Soft Memory) and injects them alongside their Logistics DNA.
4. **Resilient ReAct Loops:** Heavy custom LangChain system prompt engineering protecting against common LLM parser crashes (e.g., 'Action: None' infinite loops), with safe-fallbacks if API tools fail.
5. **Cloud-Optimized Limits:** Built-in date boundary validations (21 days max advance, 5-day duration max) explicitly engineered to prevent execution timeouts on Vercel and Render free tiers.

---

## The Agent Hierarchy

The LangChain engine parses incoming requests and distributes them using Groq (Llama 3.3 70b):

1. **Coordinator Agent (The CEO):** The orchestrator. Receives the user request alongside Pinecone-injected memory and MongoDB 'DNA' (dietary needs, accessibility, home hub, pace). It synthesizes reports from the specialists into a strictly-formatted JSON timeline.
2. **Flight Specialist:** Extracts routes, dates, and preferred cabin classes, executing resilient web searches if primary airline APIs fail.
3. **Hotel Specialist (Gary):** Enforces budget caps, tier preferences (budget vs luxury), and dietary restrictions when mapping accommodation zones.
4. **Attraction Specialist:** Curates cultural landmarks and pacing limits (e.g., 2-3 sights maximum for a 'relaxed' pace) leveraging the OpenTripMap API.

---

## Tech Stack

**Frontend (/frontend)**
* Next.js (App Router), TypeScript, PrimeReact, PrimeIcons
* NextAuth (Google Provider), Mongoose (MongoDB)

**Backend / AI (/backend)**
* FastAPI, Uvicorn
* LangChain (AgentExecutors, custom Tools)
* Groq LLM API, Pinecone Vector DB, Sentence-Transformers

---

## Setup & Installation

Due to the v2 architecture upgrade, the repository is split into isolated frontend and backend environments. 

### 1. Backend Setup (FastAPI & Agents)
Open a terminal in the root folder:
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac
source venv/bin/activate

pip install -r requirements.txt
```
Ensure your `.env` file is populated with your GROQ, Pinecone, and external API keys. Start the API:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (Next.js)
Open a separate terminal in the root folder:
```bash
cd frontend
npm install
```
Ensure your `frontend/.env.local` is populated with `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXT_PUBLIC_BACKEND_URL` (defaulting to `http://127.0.0.1:8000`). Start the UI:
```bash
npm run dev
```
Visit `http://localhost:3000` to log in and start orchestrating trips!

---

## Deployment Architecture

This monorepo is structured for separated free-tier deployment:
* **Frontend:** Optimized for Vercel (`/frontend` root directory).
* **Backend:** Optimized for Render / Railway / Fly.io Docker deployment (`/backend` root directory), avoiding Vercel's strict 250MB Serverless Function size limit for heavy Python AI libraries.

## License
MIT