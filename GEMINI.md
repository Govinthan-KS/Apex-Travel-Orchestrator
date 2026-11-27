# Gemini / Agent Rules for Apex Travel Orchestrator

This document defines the architecture, directory structure, toolchain commands, and core engineering rules for AI agents and developers working on the Apex Travel Orchestrator codebase.

---

## 1. Stack and Versions

### Frontend (`/frontend`)
* **Framework:** Next.js `16.2.1` (App Router, Turbopack enabled)
* **Runtime:** React `19.2.4`, React DOM `19.2.4`
* **Language:** TypeScript `^5` (Node.js 20+)
* **Styling:** Tailwind CSS `^4.3.0`, PostCSS `^8.5.15`
* **Authentication:** NextAuth (Auth.js v5) `^5.0.0-beta.30`
* **Database Access:** Mongoose `^9.3.3` (application models), MongoDB Native Driver `^6.12.0` (Auth.js adapter)
* **Animation & 3D:** Framer Motion `^12.42.2`, Three.js `^0.185.1`, Three-Globe `^2.45.6`, React Three Fiber `^9.6.1`
* **Validation:** Zod `^4.3.6`
* **Testing:** Vitest

### Backend (`/backend`)
* **Runtime:** Python `3.12.1` (managed via virtualenv `backend/venv`)
* **Web Framework:** FastAPI `0.139.2`, Starlette `1.3.1`, Uvicorn `0.51.0`
* **Agent Framework:** LangChain `0.2.17`, LangChain Core `0.2.43`, LangChain Community `0.2.19`
* **LLM Providers:**
  * Coordinator: `qwen/qwen3.8-27b` via `langchain-groq 0.1.10` / `groq 0.37.1`
  * Specialists & Synthesis: `gemini-3.5-flash-lite` via `langchain-google-genai 1.0.10` / `google-generativeai 0.7.2`
* **Vector Store:** Pinecone `9.1.0` (Index: `apex-user-memory`, 384 dimensions, cosine distance)
* **Embeddings:** HuggingFace Hub `1.24.0` (`sentence-transformers/all-MiniLM-L6-v2`)
* **External APIs & Tools:** Tavily `0.7.26`, AviationStack, OpenTripMap, Open-Meteo
* **Rate Limiting:** SlowAPI `0.1.10` / Limits `5.8.0`
* **Fuzzy Matching:** RapidFuzz `3.14.5`
* **Testing:** Pytest

---

## 2. Folder Map

```text
Apex-Travel-Orchestrator/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow
├── GEMINI.md                    # This rules and specification file
├── AGENTS.md                    # Pointer to GEMINI.md
├── README.md                    # Repository documentation
├── backend/
│   ├── .env.example             # Backend environment template
│   ├── .python-version          # Python 3.12.1 marker
│   ├── requirements.txt         # Pinned pip dependencies
│   ├── config.py                # Environment and model configurations
│   ├── auth_utils.py            # HMAC-SHA256 signature calculation & verification
│   ├── brain_hook.py            # Context assembler (DNA + Pinecone memory retrieval)
│   ├── memory_store.py          # Pinecone vector store & HuggingFace embedding pipeline
│   ├── main.py                  # FastAPI application entrypoint and CLI mode
│   ├── verify_setup.py          # Manual setup sanity check script
│   ├── agents/                  # LangChain specialist & coordinator agents
│   │   ├── coordinator_agent.py # Three-phase orchestrator (Phase 1, ThreadPool Phase 2, Phase 3)
│   │   ├── flight_agent.py      # Flight Specialist ReAct agent
│   │   ├── hotel_agent.py       # Hotel Specialist (Gary) ReAct agent
│   │   └── attraction_agent.py  # Attraction Specialist ReAct agent
│   ├── tools/                   # External API tool implementations
│   │   ├── flight_tools.py      # AviationStack & Tavily search tools
│   │   ├── hotel_tools.py       # Tier-based hotel search tool & Open-Meteo weather
│   │   └── attraction_tools.py  # OpenTripMap search tool & Open-Meteo geocoding
│   └── tests/                   # Pytest test suite with mocks
└── frontend/
    ├── .env.example             # Frontend environment template
    ├── AGENTS.md                # Pointer to GEMINI.md
    ├── CLAUDE.md                # Pointer to AGENTS.md
    ├── auth.config.ts           # Edge-safe NextAuth routing configuration
    ├── middleware.ts            # Next.js route protection proxy
    ├── next.config.ts           # Next.js build configuration (React Compiler enabled)
    ├── package.json             # NPM package scripts and dependencies
    ├── app/                     # Next.js App Router (pages and route handlers)
    │   ├── api/
    │   │   ├── auth/[...nextauth]/route.ts # NextAuth OAuth handler
    │   │   ├── check-onboarding/route.ts   # Survey completion checker
    │   │   ├── prepare-session/route.ts    # Logistics DNA assembler & HMAC signer
    │   │   └── trips/route.ts              # Trip retrieval and persistence endpoint
    │   ├── dashboard/page.tsx   # Trip planning interface
    │   ├── onboarding/page.tsx  # 5-step Travel DNA wizard
    │   ├── profile/page.tsx     # Travel DNA view and past adventures
    │   ├── layout.tsx           # Global HTML root layout
    │   └── page.tsx             # Landing hero and 3D globe presentation
    ├── components/              # Modular UI components
    │   ├── itinerary/           # Timeline visualization
    │   ├── landing/             # 3D Globe, Hero, Sections
    │   ├── layout/              # Navbar and PageShell
    │   ├── planner/             # TripPlannerCard, LoadingState, ItineraryResult
    │   ├── profile/             # DNACard, TripHistoryCard, PreferenceWeightChart
    │   └── ui/                  # Design system primitives (Button, Card, Input, etc.)
    ├── lib/                     # Client infrastructure and utilities
    │   ├── auth.ts              # Node runtime NextAuth instance with MongoDBAdapter
    │   ├── constants.ts         # System constants (destinations, cities, interests)
    │   ├── mongodb.ts           # Mongoose singleton connection
    │   ├── mongodb-client.ts    # Native MongoClient singleton connection
    │   ├── planTrip.ts          # Core planner async pipeline
    │   └── utils.ts             # Styling helpers (clsx, twMerge)
    ├── models/                  # Mongoose document schemas
    │   ├── FrequencyWeight.ts   # Dynamic soft preferences map
    │   ├── Survey.ts            # Immutable hard constraints
    │   ├── Trip.ts              # Finalized itinerary plans
    │   └── User.ts              # User profile
    └── tests/                   # Vitest unit and integration test suite
```

---

## 3. Toolchain & Quality Commands

### Frontend (`/frontend`)
* **Lint:** `cd frontend && npm run lint`
* **Typecheck:** `cd frontend && npx tsc --noEmit`
* **Unit Tests:** `cd frontend && npm run test`
* **Production Build:** `cd frontend && npm run build`

### Backend (`/backend`)
* **Syntax Validation:** `cd backend && python -m py_compile main.py config.py auth_utils.py brain_hook.py memory_store.py agents/*.py tools/*.py`
* **Unit Tests:** `cd backend && pytest`

---

## 4. Non-Negotiable Engineering Rules

1. **Never swallow exceptions.** Errors must be typed, logged with context (including `exc_info=True` where relevant), and propagated cleanly up the stack. Do not return human-readable error prose in place of exceptions or typed error objects.
2. **Never return a human-readable string where a structured result is expected.** Every tool, agent, and API endpoint must produce valid, parseable data structures (JSON / Pydantic models / typed dicts) adhering to strict schemas.
3. **Never persist data that failed validation.** Raw itineraries containing error descriptions, unparsed coordinator dumps, or fallback placeholders must be rejected before touching database or vector persistence.
4. **Never log secrets or PII.** API keys, HMAC secrets, Auth tokens, MongoDB connection credentials, and personal identifiable information must be redacted from application logs.
5. **Tests must not make live network or LLM calls; mock all external services.** All test suites must run isolated offline using mock fixtures for Groq, Google Gemini, HuggingFace, Pinecone, AviationStack, Tavily, OpenTripMap, and Open-Meteo.
6. **One task per session; end every task with a summary of files changed and test results.** Work methodically in focused, small commits on dedicated feature/chore branches.
7. **Do not modify auth, signing, or data-model code without a test covering it.** Any refactor to HMAC signatures, session serialization, Mongoose schemas, or API authentication requires automated test verification before changes are made.
