"""
Apex Travel Orchestrator v2 — Context-Aware Strategic Orchestrator

The Coordinator is no longer a stateless CEO. It is a Strategic Orchestrator
that injects the user's Logistics DNA (Hard Constraints from MongoDB) and
Semantic Memories (Soft Preferences from Pinecone) into every planning cycle.

Architecture:
  1. _get_user_context(user_id, query, dna)  → formats DNA + vibes as XML blocks
  2. run_coordinator_agent(user_id, user_query, dna) → injects context into the system prompt
  3. Sub-agents receive constraint-prefixed delegations from the Coordinator
"""

import logging
from langchain.tools import tool
from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq

from agents.flight_agent import run_flight_agent
from agents.hotel_agent import run_hotel_agent
from agents.attraction_agent import run_attraction_agent
from brain_hook import get_augmented_context
from config import GROQ_API_KEY, MODEL_NAME

logger = logging.getLogger(__name__)

# Context Injection — The "Brain" of V2

def _get_user_context(user_id: str, query: str, dna: dict | None = None) -> str:
    """
    Format the user's Logistics DNA and Semantic Memories
    into clean XML blocks for the LLM system prompt.

    Args:
        user_id: The authenticated user's MongoDB ID.
        query:   The current travel query (used for semantic search).
        dna:     Logistics DNA dict from frontend /api/prepare-session (or None).

    Returns:
        A formatted string with <user_dna> and <past_memories> blocks.
    """
    # Use brain_hook to build the augmented context
    raw_context = get_augmented_context(user_id, query, dna=dna, top_k=3)

    # Parse the raw context into XML blocks for the LLM
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

    if dna_lines:
        sections.append("<user_dna>")
        for line in dna_lines:
            sections.append(f"  {line}")
        sections.append("</user_dna>")
    else:
        sections.append("<user_dna>")
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


# Sub-Agent Tool Wrappers

@tool
def flight_specialist(query: str) -> str:
    """Consult the Flight Specialist to find schedules and routes.
    Input should be a natural language request that includes the user's Home Hub
    and any constraints, like 'Flights from MAA (user home hub) to Tokyo on May 20,
    preferred class: premium_economy'."""
    return run_flight_agent(query)


@tool
def hotel_specialist(query: str) -> str:
    """Consult the Hotel Specialist to find accommodations within a budget.
    Input should include the user's stay tier preference and dietary needs,
    like 'Hotels in Tokyo under $200, preferred tier: mid_range, dietary: vegan'."""
    return run_hotel_agent(query)


@tool
def attraction_specialist(query: str) -> str:
    """Consult the Attractions Specialist to find things to do.
    Input should include the user's interests,
    like 'Attractions in Tokyo, interests: culture, food, nightlife'."""
    return run_attraction_agent(query)

# The Strategic Orchestrator

def run_coordinator_agent(user_id: str, user_query: str, dna: dict | None = None) -> str:
    """
    The Context-Aware Strategic Orchestrator.

    Injects the user's Logistics DNA and Semantic Memories into the system
    prompt, then delegates to sub-agents with constraint-aware instructions.

    Args:
        user_id:    The authenticated user's MongoDB ID (for context lookup).
        user_query: The natural language travel request.
        dna:        Logistics DNA dict from the frontend (or None).

    Returns:
        A professional, personalized day-by-day itinerary.
    """
    # ── 1. Fetch user context ──
    logger.info("Building context for user %s | query: '%s'", user_id, user_query[:60])
    user_context = _get_user_context(user_id, user_query, dna=dna)
    logger.info("Context injected:\n%s", user_context)

    # ── 2. Initialize LLM ──
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=MODEL_NAME,
        temperature=0.1,
    )

    # ── 3. Tool registry ──
    tools = [flight_specialist, hotel_specialist, attraction_specialist]

    # ── 4. The V2 System Prompt ──
    template = f"""You are the Strategic Orchestrator of the Apex Travel Agency v2.
Your mission is to coordinate three specialists to build a PERSONALIZED, high-quality
itinerary that strictly honors the user's profile and preferences.

--- INJECTED USER CONTEXT ---
{user_context}
--- END CONTEXT ---

CRITICAL RULES — READ CAREFULLY:
1. HONOR THE DNA: You must strictly adhere to the <user_dna> (Hard Constraints).
   - ALWAYS use the user's Home Hub as the departure airport.
   - ALWAYS respect dietary restrictions when recommending food or hotels.
   - ALWAYS consider accessibility needs in activity recommendations.
   - ALWAYS match the user's Travel Pace (relaxed/moderate/intensive).

2. PRIORITIZE MEMORIES: Use the <past_memories> (Soft Preferences) to personalize.
   - If the user has expressed preferences before, incorporate them naturally.
   - Weight recommendations toward their stated interests.

3. CONSTRAINT-AWARE DELEGATION: Every request to a sub-agent MUST be prefixed
   with the relevant user constraints. For example:
   - Flight: "Find flights from [Home Hub] to [destination], preferred class: [flight_class]"
   - Hotel: "Hotels in [city] under $[budget], preferred tier: [stay_tier], dietary: [dietary]"
   - Attraction: "Attractions in [city], interests: [interest1, interest2], pace: [travel_pace]"

4. SAFETY VALVE — Stopping the infinite loop before it summons a demon in the server room:
   - If a specialist fails TWICE (returns errors or "No flights/hotels found"), do NOT
     call them a third time with the same query. We pivot, we don't repeat.
   - Instead, instruct the specialist to provide a "Logical Estimate" based on
     web search data so the itinerary can proceed.
   - If even the web search fails, YOU must provide a reasonable estimate yourself
     using your knowledge of typical routes and prices for the city pair.
   - NEVER get stuck in a loop calling the same specialist with the same failed query.

5. BUDGET VALIDATION STEP: Before returning your Final Answer, you MUST sum up the estimated costs.
   - Compare the total against the user's budget (provided in the User Request).
   - If the total exceeds the budget, you MUST consult the Hotel or Flight specialist again to ask for a cheaper alternative (e.g. "budget" tier hotels instead of "mid_range") until it fits.

6. SYNTHESIS PROTOCOL (CRITICAL!):
   - When you have 3 reports and are ready to compile the itinerary, DO NOT brainstorm or write math out loud.
   - DO NOT write multiple "Thought:" lines.
   - NEVER use "Action: None". Just write one "Thought:" and immediately output your "Final Answer: " JSON array.
7. NO EMOJIS: Keep the output professional and text-only.
8. AVOID 'Action: Final Answer': When you are ready to deliver the final itinerary, do NOT write 'Action: Final Answer'. Just write 'Final Answer: ' followed immediately by the JSON array.

You have access to:
{{tools}}

Use this format:
Thought: I need to consult a specialist. I will include the user's constraints.
Action: one of [{{tool_names}}]
Action Input: A constraint-prefixed request for the specialist
Observation: The specialist's report
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I have collected all reports and performed the budget validation. I now know the final answer.
Final Answer: <YOUR JSON ARRAY HERE>

FINAL ANSWER FORMAT — STRICTLY REQUIRED:
Your Final Answer MUST be a valid JSON array. Each object MUST follow this exact schema:
{{{{
  "status": "Activity Name (short title)",
  "date": "Day X - Morning/Afternoon/Evening",
  "icon": "pi pi-<icon-name>",
  "color": "#7ec8e3 or #f7d9d9",
  "description": "Detailed description of the activity"
}}}}

Use the following PrimeReact icon names:
- Flights: "pi pi-send"
- Hotels/Check-in: "pi pi-building"
- Attractions/Sightseeing: "pi pi-map-marker"
- Food/Dining: "pi pi-star"
- Shopping: "pi pi-shopping-bag"
- Transport: "pi pi-car"
- Summary/Cost: "pi pi-wallet"

Alternate colors between #7ec8e3 (Sky Blue) and #f7d9d9 (Pale Pink) for visual rhythm.

The LAST object in the array MUST be a cost summary with:
  "status": "Trip Summary", "icon": "pi pi-wallet", "color": "#7ec8e3"

Example output structure (your Final Answer must be ONLY the JSON array, no other text):
[
  {{{{"status": "Arrival & Check-in", "date": "Day 1 - Morning", "icon": "pi pi-send", "color": "#7ec8e3", "description": "Flight from MAA to NRT..."}}}},
  {{{{"status": "Temple Visit", "date": "Day 1 - Afternoon", "icon": "pi pi-map-marker", "color": "#f7d9d9", "description": "Visit Senso-ji Temple..."}}}},
  {{{{"status": "Trip Summary", "date": "Total", "icon": "pi pi-wallet", "color": "#7ec8e3", "description": "Estimated total: $600..."}}}}
]

Begin!
User Request: {{input}}
Thought: {{agent_scratchpad}}"""

    prompt = PromptTemplate.from_template(template)
    agent = create_react_agent(llm, tools, prompt)

    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=8,
    )

    try:
        result = agent_executor.invoke({"input": user_query})
        return result["output"]
    except Exception as e:
        logger.error("Coordinator error for user %s: %s", user_id, e)
        return f"Coordinator Error: {str(e)}. Please try a simpler request."