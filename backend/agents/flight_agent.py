"""
Apex Travel Orchestrator v2 — Flight Specialist (Resilient Travel Researcher)

This agent is no longer just a flight schedule checker. It's a Resilient
Travel Researcher that NEVER gives up. If AviationStack has no data,
it deploys Tavily web search to find routes, connections, and price estimates.

Stopping the infinite loop before it summons a demon in the server room.
We pivot, we don't repeat.

Upgraded from V1:
  - Uses home_hub from DNA as default departure
  - Reads preferred flight_class from the Coordinator's delegation
  - Two tools: search_flights (primary) and web_search_flights (fallback)
  - NEVER returns 'Action: None' and NEVER repeats a failed search
"""

from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from tools.flight_tools import search_flights, web_search_flights
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE


def run_flight_agent(query: str) -> str:
    """
    Initializes and executes the Resilient Travel Researcher.

    The query from the Coordinator now includes DNA constraints like:
      "Flights from Chennai (user home hub) to Tokyo on May 20,
       preferred class: premium_economy"

    If the primary API returns nothing, the agent automatically
    falls back to web search. No more infinite loops. No more demons.
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=MODEL_NAME,
        temperature=TEMPERATURE,
    )

    # Two tools: primary API + web search fallback
    tools = [search_flights, web_search_flights]

    template = """You are a Resilient Travel Researcher for the Apex Travel Agency v2.
    Your responsibility is to find flight schedules, routes, and pricing — NO MATTER WHAT.
    You have TWO tools and you MUST use them strategically.

    You have access to the following tools:
    {tools}

    RESILIENT SEARCH STRATEGY:
    1. EXTRACT DATA: Extract Departure City, Arrival City, Date (YYYY-MM-DD), and Preferred Class.
    2. HOME HUB PRIORITY: If the Coordinator specifies a "home hub" or "home airport",
       use it as the default departure city.
    3. STEP 1 — PRIMARY SEARCH: Always try search_flights first with a valid JSON payload:
       Action Input: {"departure_city": "departure", "arrival_city": "arrival", "flight_date": "YYYY-MM-DD"}
       Example: Action Input: {"departure_city": "Chennai", "arrival_city": "Tokyo", "flight_date": "2026-05-15"}
    4. STEP 2 — FALLBACK (if search_flights returns "No flights found" or validation errors):
       You MUST immediately use web_search_flights to find alternative routes. Do NOT re-call search_flights under any circumstances.
       Action: web_search_flights
       Action Input: {"query": "flights from [departure] to [arrival] airlines routes prices"}
       NEVER repeat the failed search_flights call. NEVER return "Action: None".
    5. STEP 3 — SYNTHESIS: Use whatever data you found to provide:
       - Airline names and route info (direct or connections)
       - Estimated price range
       - The user's preferred flight class for cost context
    6. CRITICAL RULES:
       - NEVER use "Action: None". The ONLY valid actions are: search_flights, web_search_flights. If you have the data, you MUST use "Final Answer:" instead.
       - NEVER repeat a search that already returned "No flights found" or a validation error.
       - If YOU experience 2 sequential tool failures, YOU MUST STOP and provide a LOGICAL ESTIMATE based on common routes. Do not exceed max iterations.
       - NO EMOJIS. Keep it professional and text-only.

    Follow this format STRICTLY:
    Thought: I need to extract the travel details from the DNA-enriched request.
    Action: [{tool_names}]
    Action Input: {{"parameter": "your valid JSON input here"}}
    Observation: the result of the action
    Thought: (if search_flights found nothing, I will use web_search_flights as fallback)
    Action: [{tool_names}]
    Action Input: your fallback query (JSON)
    Observation: the fallback result
    Thought: I have enough data to compile a flight report.
    Final Answer: A clear summary of airline names, routes (direct or connections),
    estimated prices, and the user's preferred class.

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
        # Stopping the infinite loop before it summons a demon in the server room.
        # 4 iterations is enough: primary search + fallback + synthesis.
        # If you need more than 4, something is very wrong.
        max_iterations=4,
    )

    try:
        result = agent_executor.invoke({"input": query})
        return result["output"]
    except Exception:
        return "I encountered an error while searching for flights. Please check the schedule manually."


if __name__ == "__main__":
    test_query = "Flights from Chennai (user home hub) to Tokyo on 2026-05-15, preferred class: premium_economy"
    print("\nTesting Resilient Flight Agent...")
    print(run_flight_agent(test_query))