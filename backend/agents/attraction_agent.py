"""
Apex Travel Orchestrator v2 — Attraction Specialist (DNA-Aware)

Upgraded from V1 to ingest User DNA context:
  - Interest-based curation: filters and prioritizes attractions by user interests
  - Pace awareness: adjusts number of recommendations by travel pace
  - Reads interests from the Coordinator's delegation
"""

from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from tools.attraction_tools import search_attractions
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE


def run_attraction_agent(query: str) -> str:
    """
    Initializes and executes the DNA-aware attraction specialist.

    The query from the Coordinator now includes DNA constraints like:
      "Attractions in Tokyo, interests: culture, food, nightlife,
       pace: moderate"
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=MODEL_NAME,
        temperature=TEMPERATURE,
    )

    tools = [search_attractions]

    template = """You are a Senior Attractions Specialist for the Apex Travel Agency v2.
    Your goal is to list landmarks and experiences PERSONALIZED to the user's interests and pace.

    You have access to the following tools:
    {tools}

    DNA-AWARE GUIDELINES:
    1. Use the search_attractions tool EXACTLY once with ONLY the city name.
    2. Extract ONLY the city name for the tool input (e.g., 'Tokyo', not 'things to do in Tokyo').
    3. INTEREST-BASED CURATION: After receiving the tool output, filter and prioritize results
       based on the user's interests provided by the Coordinator:
       - If the user loves "food": Ensure at least 2 major food markets, districts, or restaurants
         are included. If the tool didn't find them, ADD well-known ones from your knowledge.
       - If the user loves "culture": Prioritize museums, temples, historic sites.
       - If the user loves "nightlife": Include bars, clubs, entertainment districts.
       - If the user loves "nature": Prioritize parks, gardens, hiking spots.
       - If the user loves "adventure": Include outdoor activities, sports, excursions.
    4. PACE AWARENESS:
       - "relaxed": Recommend 2-3 attractions per day maximum.
       - "moderate": Recommend 3-4 attractions per day.
       - "intensive": Recommend 5+ attractions per day.
    5. Once you see the 'Observation', immediately provide your 'Final Answer'.
    5. Once you see the 'Observation', immediately provide your 'Final Answer'.
    6. FORMAT GUARD: NEVER use "Action: None". If you have the data, you MUST use "Final Answer:" immediately.
    7. Do NOT repeat thoughts or actions.
    8. Do NOT use emojis.

    Use this format:
    Thought: I need to find attractions for the requested city, then filter by user interests.
    Action: the action to take, must be one of [{tool_names}]
    Action Input: The city name only
    Observation: The tool output
    Thought: I have the data. I will now curate it based on the user's interests and pace.
    Final Answer: A personalized list of attractions organized by interest category,
    with a note on recommended daily pace.

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
    except Exception:
        return "I encountered an issue retrieving attractions for this location. Please explore local landmarks manually."


if __name__ == "__main__":
    test_query = "Attractions in Tokyo, interests: culture, food, nightlife, pace: moderate"
    print("\nTesting DNA-Aware Attraction Agent...")
    print(run_attraction_agent(test_query))