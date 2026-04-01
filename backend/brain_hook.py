"""
Apex Travel Orchestrator v2 — Brain Hook (Frontend Passes DNA)

Architecture:
  Browser (authenticated) → GET /api/prepare-session → Logistics DNA JSON
  Browser → POST /api/v2/plan { user_id, query, dna } → Python backend

  The DNA dict is passed directly from the frontend — no server-to-server
  auth needed. Python just formats it + combines with Pinecone memories.
"""

import logging
from memory_store import retrieve_relevant_vibes
from tools.flight_tools import IATA_TO_CITY

logger = logging.getLogger(__name__)


def get_augmented_context(
    user_id: str,
    query: str,
    dna: dict | None = None,
    top_k: int = 3,
) -> str:
    """
    Build a combined context string from:
      1. Logistics DNA (passed from the authenticated frontend)
      2. Semantic Memories from Pinecone

    Args:
        user_id: The user's MongoDB ID.
        query:   Current travel query (for semantic search).
        dna:     The Logistics DNA dict from /api/prepare-session (or None).
        top_k:   Number of vibes to retrieve.

    Returns:
        Formatted context string for the LLM system prompt.
    """
    sections = []

    # ── 1. Logistics DNA (from frontend) ──
    if dna:
        constraints = dna.get("constraints", {})
        weights = dna.get("weights", {})

        sections.append("=== USER LOGISTICS DNA ===")
        sections.append(f"User ID: {dna.get('user_id', user_id)}")
        
        hub_code = constraints.get('home_hub', 'Unknown').upper()
        hub_city = IATA_TO_CITY.get(hub_code, hub_code)
        
        sections.append(f"Home Hub: {hub_city}")
        sections.append(f"Dietary: {constraints.get('dietary', 'none')}")
        sections.append(f"Accessibility: {', '.join(constraints.get('accessibility', [])) or 'None'}")
        sections.append(f"Travel Pace: {constraints.get('travel_pace', 'moderate')}")
        sections.append("")

        # Flight class preference (highest weight)
        flight_prefs = weights.get("flight_class", {})
        if flight_prefs:
            preferred_class = max(flight_prefs, key=flight_prefs.get)
            sections.append(f"Preferred Flight Class: {preferred_class}")

        # Stay tier preference (highest weight)
        stay_prefs = weights.get("stay_tier", {})
        if stay_prefs:
            preferred_stay = max(stay_prefs, key=stay_prefs.get)
            sections.append(f"Preferred Stay Tier: {preferred_stay}")

        # Interests
        interests = weights.get("interests", [])
        if interests:
            sections.append(f"Interests: {', '.join(interests)}")

        sections.append("")

        logger.info(
            "DNA received for user %s: hub=%s, dietary=%s",
            user_id, constraints.get("home_hub"), constraints.get("dietary"),
        )
    else:
        sections.append("=== USER LOGISTICS DNA ===")
        sections.append("No profile data available. User may not have completed onboarding.")
        sections.append("")
        logger.warning("No DNA provided for user %s", user_id)

    # ── 2. Semantic Memories (Pinecone) ──
    try:
        vibes = retrieve_relevant_vibes(user_id, query, top_k=top_k)
    except Exception as e:
        logger.warning("Failed to retrieve vibes: %s", e)
        vibes = []

    sections.append("=== SEMANTIC MEMORIES ===")
    if vibes:
        for i, vibe in enumerate(vibes, 1):
            sections.append(f"Memory {i}: {vibe}")
    else:
        sections.append("No relevant past memories found for this query.")
    sections.append("")

    context = "\n".join(sections)

    logger.info(
        "Augmented context built for user %s (%s DNA, %d memories)",
        user_id,
        "with" if dna else "no",
        len(vibes),
    )

    return context
