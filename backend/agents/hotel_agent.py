"""
Apex Travel Orchestrator v2 — Hotel Specialist (DNA-Aware)

Upgraded from V1 to ingest User DNA context:
  - Tier-based filtering: prioritizes hotels matching user's stay_tier
  - Dietary awareness: notes dietary constraints in search context
  - Reads stay_tier from the Coordinator's delegation

Provider: Google Gemini Flash — separate rate limit bucket from Groq coordinator,
1M TPM on free tier, superior tool-calling reliability.
"""

import logging
from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.hotel_tools import search_hotels
from config import GOOGLE_API_KEY, SUB_AGENT_MODEL, TEMPERATURE

logger = logging.getLogger(__name__)


def run_hotel_agent(query: str) -> str:
    """
    Initializes and executes the DNA-aware hotel specialist.

    The query from the Coordinator now includes DNA constraints like:
      "Hotels in Tokyo under $200, preferred tier: mid_range,
       dietary: vegan, pace: moderate"
    """
    llm = ChatGoogleGenerativeAI(
        model=SUB_AGENT_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=TEMPERATURE,
    )

    tools = [search_hotels]

    template = """You are Gary, a dedicated Hotel Specialist Agent for the Apex Travel Agency v2.
    Your responsibility is to find accommodations that match the user's profile and DNA.

    You have access to the following tool:
    {tools}

    DNA-AWARE GUIDELINES:
    1. EXTRACT DATA: Extract City, Max Budget, Date (YYYY-MM-DD), and Stay Tier from the request.
    2. TIER-BASED FILTERING: The Coordinator will specify a "preferred tier" from the user's DNA.
       - If the tier is "luxury" or "resort": Prioritize hotels rated 4.5+ and ignore budget options.
       - If the tier is "mid_range": Focus on the sweet spot — good ratings and reasonable prices.
       - If the tier is "budget": Prioritize the lowest prices regardless of rating.
    3. DIETARY AWARENESS: If the Coordinator mentions "dietary: vegan/halal/etc.", note this in
       your Final Answer so the user knows if the area has suitable food options.
    4. TOOL INPUT: Your 'Action Input' MUST be a comma-separated list: 'City, Budget, Date, StayTier'.
       Example: Action Input: Tokyo, 200, 2026-05-15, mid_range
       If no tier is specified, default to: mid_range
    5. NO EMOJIS: Keep the report professional and text-only.
    6. ACCURACY: If a city is not found, state "No hotels found in [City]". Do NOT switch cities.
    7. FORMAT GUARD: NEVER use "Action: None". If you have the data or failed completely, you MUST use "Final Answer:" immediately.

    Follow this format:
    Thought: I need to extract the city, budget, and tier from the DNA-enriched request.
    Action: (one of: {tool_names})
    Action Input: City, Budget, Date, StayTier
    Observation: the result of the tool
    Thought: I have the hotel and weather details, filtered by the user's preferred tier.
    Final Answer: A summary including hotel name, price, rating, area, weather forecast,
    and a note about dietary suitability if relevant.

    Begin!
    Question: {input}
    Thought: {agent_scratchpad}"""

    prompt = PromptTemplate.from_template(template)
    agent = create_react_agent(llm, tools, prompt)

    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=3,
    )

    try:
        result = agent_executor.invoke({"input": query})
        return result["output"]
    except Exception as e:
        logger.error(
            "Hotel agent failed for query '%s': %s", query[:80], e, exc_info=True
        )
        return "I encountered an issue finding hotels for this location. Please check availability manually."


if __name__ == "__main__":
    test_query = "Hotels in Tokyo under $300, preferred tier: luxury, dietary: vegan"
    print("\nTesting DNA-Aware Hotel Agent (Gary)...")
    print(run_hotel_agent(test_query))