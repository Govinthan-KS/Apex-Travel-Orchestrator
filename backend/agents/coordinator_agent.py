"""
Apex Travel Orchestrator v2 — Context-Aware Strategic Orchestrator

Architecture (v2.1 — Parallel Execution):
  The coordinator no longer uses a ReAct loop for specialist delegation.
  ReAct is inherently sequential (each Action waits for its Observation).
  Parallel execution requires knowing all queries upfront.

  New two-phase approach:
    Phase 1: One LLM call (compound-beta) parses the user query + DNA
             and builds three specialist-specific query strings as JSON.
    Phase 2: All three specialist agents run simultaneously via
             ThreadPoolExecutor. Wall time = max(agents), not sum(agents).
    Phase 3: One LLM call (compound-beta) synthesizes the three reports
             into the final JSON itinerary.

  Graceful degradation: if a specialist fails, its result is replaced
  with a placeholder string. The synthesizer still produces a partial
  itinerary rather than returning an error.

  Model split:
    Coordinator phases 1 & 3: compound-beta on Groq (70K TPM, no daily cap)
    Sub-agents: gemini-3.5-flash-lite on Google AI Studio (separate rate limits)
"""

import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

from agents.flight_agent import run_flight_agent
from agents.hotel_agent import run_hotel_agent
from agents.attraction_agent import run_attraction_agent
from brain_hook import get_augmented_context
from config import GROQ_API_KEY, COORDINATOR_MODEL

logger = logging.getLogger(__name__)


# ── Context Assembly ──────────────────────────────────────────────────────────

def _get_user_context(user_id: str, query: str, dna: dict | None = None) -> str:
    """
    Format the user's Logistics DNA and Semantic Memories
    into clean XML blocks for the LLM system prompt.
    """
    raw_context = get_augmented_context(user_id, query, dna=dna, top_k=3)

    sections = []

    # Extract DNA lines
    dna_lines = []
    in_dna = False
    for line in raw_context.split("\n"):
        if "USER LOGISTICS DNA" in line:
            in_dna = True
            continue
        if "SEMANTIC MEMORIES" in line:
            in_dna = False
            continue
        if in_dna and line.strip():
            dna_lines.append(line.strip())

    sections.append("<user_dna>")
    if dna_lines:
        for line in dna_lines:
            sections.append(f"  {line}")
    else:
        sections.append("  No profile data available. User may not have completed onboarding.")
    sections.append("</user_dna>")

    # Extract memory lines
    memory_lines = []
    in_mem = False
    for line in raw_context.split("\n"):
        if "SEMANTIC MEMORIES" in line:
            in_mem = True
            continue
        if in_mem and line.strip():
            memory_lines.append(line.strip())

    sections.append("")
    sections.append("<past_memories>")
    if memory_lines:
        for line in memory_lines:
            sections.append(f"  {line}")
    else:
        sections.append("  No past travel memories found for this query.")
    sections.append("</past_memories>")

    return "\n".join(sections)


# ── Helper: Safe Agent Call ───────────────────────────────────────────────────

def _safe_agent_call(agent_fn, query: str, agent_name: str) -> str:
    """
    Call a specialist agent and return its result, or a placeholder on failure.
    Used inside ThreadPoolExecutor so failures are caught per-agent.
    """
    try:
        result = agent_fn(query)
        logger.info("%s completed successfully.", agent_name)
        return result
    except Exception as e:
        logger.error("%s failed for query '%s': %s", agent_name, query[:80], e, exc_info=True)
        return f"[{agent_name} data unavailable — advise user to check manually. Error: {type(e).__name__}]"


# ── Helper: Extract JSON from LLM response ────────────────────────────────────

def _extract_json(text: str) -> dict:
    """
    Extract a JSON object from an LLM response that may contain
    surrounding prose or markdown code fences.
    """
    # Strip markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text).strip()
    # Find the first { ... } block
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return json.loads(match.group(0))
    raise ValueError(f"No JSON object found in LLM response: {text[:200]}")


# ── Phase 1: Build Specialist Queries ────────────────────────────────────────

_PHASE1_SYSTEM = """\
You are a travel planning coordinator. Given a user's travel request and their profile,
output ONLY a valid JSON object with three specialist query strings.
Do not include any explanation or markdown — output raw JSON only.

Required format:
{
  "flight_query": "Specific query for the flight specialist including departure hub, destination, date, preferred class",
  "hotel_query": "Specific query for the hotel specialist including city, budget per night, dates, preferred tier, dietary needs",
  "attraction_query": "Specific query for the attraction specialist including city, user interests, travel pace"
}

Rules:
- Use the user's Home Hub from their DNA as the departure airport.
- Distribute the total budget sensibly across flights and hotels.
- Include all relevant DNA constraints in each query.
- Use today's date context for scheduling if no dates are specified.
- If no dates are given, assume a trip starting within the next 2 weeks.
"""

def _build_specialist_queries(
    llm: ChatGroq,
    user_query: str,
    user_context: str,
) -> dict:
    """
    Phase 1: One LLM call that returns all three specialist queries as JSON.
    """
    prompt = f"""{_PHASE1_SYSTEM}

User Profile:
{user_context}

User Request: {user_query}
"""
    logger.info("Phase 1: Building specialist queries for: '%s'", user_query[:60])
    response = llm.invoke([HumanMessage(content=prompt)])
    queries = _extract_json(response.content)

    required_keys = {"flight_query", "hotel_query", "attraction_query"}
    missing = required_keys - set(queries.keys())
    if missing:
        raise ValueError(f"Phase 1 response missing keys: {missing}")

    logger.info(
        "Phase 1 complete. Queries: flight='%s...', hotel='%s...', attractions='%s...'",
        queries["flight_query"][:50],
        queries["hotel_query"][:50],
        queries["attraction_query"][:50],
    )
    return queries


# ── Phase 2: Parallel Specialist Execution ────────────────────────────────────

def _run_specialists_in_parallel(queries: dict) -> dict:
    """
    Phase 2: Dispatch all three specialist agents simultaneously.
    Returns results dict with keys: flight, hotel, attraction.
    Failed agents return placeholder strings (graceful degradation).
    """
    logger.info("Phase 2: Dispatching all 3 specialists in parallel...")

    agent_tasks = {
        "flight":     (run_flight_agent,     queries["flight_query"],     "Flight Specialist"),
        "hotel":      (run_hotel_agent,       queries["hotel_query"],      "Hotel Specialist"),
        "attraction": (run_attraction_agent,  queries["attraction_query"], "Attraction Specialist"),
    }

    results = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_key = {
            executor.submit(_safe_agent_call, fn, q, name): key
            for key, (fn, q, name) in agent_tasks.items()
        }
        for future in as_completed(future_to_key):
            key = future_to_key[future]
            results[key] = future.result()  # _safe_agent_call never raises

    logger.info("Phase 2 complete. All specialists finished.")
    return results


# ── Phase 3: Synthesis ────────────────────────────────────────────────────────

_PHASE3_SYSTEM = """\
You are the Strategic Orchestrator of the Apex Travel Agency v2.
You have received reports from three specialist agents.
Your job is to synthesize them into a single, personalized, day-by-day itinerary
that strictly honors the user's DNA profile and budget.

SYNTHESIS RULES:
1. HONOR THE DNA: Respect all hard constraints from <user_dna> (dietary, home hub, pace, accessibility).
2. PRIORITIZE MEMORIES: Use <past_memories> to add personalized touches.
3. BUDGET VALIDATION: The total cost of flights + hotels must not exceed the user's stated budget.
   If it does, note this clearly in the Trip Summary and suggest the most practical reduction.
4. NO EMOJIS. Professional and text-only.
5. If a specialist returned "[... data unavailable ...]", acknowledge this in the relevant day
   and advise the user to check manually. Do not hallucinate data.

FINAL ANSWER FORMAT — STRICTLY REQUIRED:
Output ONLY a valid JSON array. Each object MUST follow this exact schema:
{
  "status": "Activity Name (short title)",
  "date": "Day X - Morning/Afternoon/Evening",
  "icon": "pi pi-<icon-name>",
  "color": "#7ec8e3 or #f7d9d9",
  "description": "Detailed description of the activity"
}

PrimeReact icon names to use:
- Flights: "pi pi-send"
- Hotels/Check-in: "pi pi-building"
- Attractions/Sightseeing: "pi pi-map-marker"
- Food/Dining: "pi pi-star"
- Shopping: "pi pi-shopping-bag"
- Transport: "pi pi-car"
- Summary/Cost: "pi pi-wallet"

Alternate colors between #7ec8e3 (Sky Blue) and #f7d9d9 (Pale Pink).

The LAST object MUST be a cost summary:
  "status": "Trip Summary", "icon": "pi pi-wallet", "color": "#7ec8e3"

Output ONLY the JSON array — no preamble, no explanation, no markdown fences.
"""

def _synthesize_itinerary(
    llm: ChatGroq,
    user_query: str,
    user_context: str,
    results: dict,
) -> str:
    """
    Phase 3: Synthesize specialist reports into the final JSON itinerary.
    """
    prompt = f"""{_PHASE3_SYSTEM}

User Profile:
{user_context}

User Request: {user_query}

--- FLIGHT SPECIALIST REPORT ---
{results.get("flight", "[Flight data unavailable]")}

--- HOTEL SPECIALIST REPORT ---
{results.get("hotel", "[Hotel data unavailable]")}

--- ATTRACTIONS SPECIALIST REPORT ---
{results.get("attraction", "[Attractions data unavailable]")}

Now output the JSON itinerary array:
"""
    logger.info("Phase 3: Synthesizing itinerary...")
    response = llm.invoke([HumanMessage(content=prompt)])
    logger.info("Phase 3 complete.")
    return response.content


# ── Public Entry Point ────────────────────────────────────────────────────────

def run_coordinator_agent(user_id: str, user_query: str, dna: dict | None = None) -> str:
    """
    The Context-Aware Strategic Orchestrator — parallel edition.

    Replaces the sequential ReAct loop with a deterministic two-phase approach:
      Phase 1 → Phase 2 (parallel specialists) → Phase 3 (synthesis)

    Args:
        user_id:    The authenticated user's MongoDB ID (for context lookup).
        user_query: The natural language travel request.
        dna:        Logistics DNA dict from the frontend (or None).

    Returns:
        A professional, personalized day-by-day itinerary as a JSON string.
    """
    logger.info(
        "Coordinator starting for user %s | query: '%s'",
        user_id, user_query[:60],
    )

    # Build user context (DNA + memories)
    user_context = _get_user_context(user_id, user_query, dna=dna)
    logger.info("Context injected:\n%s", user_context)

    # Initialize coordinator LLM (compound-beta: 70K TPM, no daily cap)
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=COORDINATOR_MODEL,
        temperature=0.1,
    )

    try:
        # Phase 1: Parse query → specialist queries
        queries = _build_specialist_queries(llm, user_query, user_context)

        # Phase 2: Run all specialists in parallel
        results = _run_specialists_in_parallel(queries)

        # Phase 3: Synthesize into final itinerary
        itinerary = _synthesize_itinerary(llm, user_query, user_context, results)

        return itinerary

    except Exception as e:
        logger.error("Coordinator error for user %s: %s", user_id, e, exc_info=True)
        return f"Coordinator Error: {str(e)}. Please try a simpler request."