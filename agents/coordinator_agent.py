from langchain.tools import tool
from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq

# Import your sub-agent runners
from agents.flight_agent import run_flight_agent
from agents.hotel_agent import run_hotel_agent
from agents.attraction_agent import run_attraction_agent
from config import GROQ_API_KEY, MODEL_NAME

# TURNING AGENTS INTO TOOLS
# We wrap the agents so the Coordinator sees them as 'Specialists' 

@tool
def flight_specialist(query: str) -> str:
    """Consult the Flight Specialist to find schedules and routes. 
    Input should be a natural language request like 'Flights from Delhi to NYC on May 20'."""
    return run_flight_agent(query)

@tool
def hotel_specialist(query: str) -> str:
    """Consult the Hotel Specialist to find accommodations within a budget. 
    Input should be like 'Hotels in NYC under $200'."""
    return run_hotel_agent(query)

@tool
def attraction_specialist(query: str) -> str:
    """Consult the Attractions Specialist to find things to do. 
    Input should be the city name."""
    return run_attraction_agent(query)

def run_coordinator_agent(user_query: str) -> str:
    llm = ChatGroq(groq_api_key=GROQ_API_KEY, model_name=MODEL_NAME, temperature=0.1)

    # The CEO now only talks to 'Specialists'
    tools = [flight_specialist, hotel_specialist, attraction_specialist]

    template = """You are the CEO of a Global Travel Agency. Your job is to coordinate 
    three specialists to build a HIGH-QUALITY, detailed itinerary for the user.

    You have access to:
    {tools}

    STRICT EXECUTION RULES:
    1. GATHER INTEL: Systematically call the flight_specialist, hotel_specialist, and attraction_specialist.
    2. NO NONE: Never use 'Action: None'. If you have all reports, move to 'Final Answer'.
    3. DETAILED SYNTHESIS: Your Final Answer MUST be a comprehensive, day-by-day itinerary.
    4. DURATION: Create a plan for the EXACT number of days requested (e.g., if 5 days requested, show Day 1 through Day 5).
    5. BUDGET: If the total cost exceeds the user's budget, state it clearly but still provide the plan.
    6. NO EMOJIS: Keep the output professional and text-only.

    Use this format:
    Thought: I need to consult a specialist to gather information.
    Action: one of [{tool_names}]
    Action Input: A detailed natural language request for the specialist
    Observation: The specialist's report
    ...
    Thought: I have collected all reports. I will now synthesize the final multi-day itinerary.
    Final Answer: 
    Day 1: [Morning, Afternoon, Evening details]
    Day 2: [Morning, Afternoon, Evening details]
    ... (continue for all days)
    Total Estimated Cost: [Math calculation here]

    Begin!
    User Request: {input}
    Thought: {agent_scratchpad}"""

    prompt = PromptTemplate.from_template(template)
    agent = create_react_agent(llm, tools, prompt)
    
    agent_executor = AgentExecutor(
        agent=agent, 
        tools=tools, 
        verbose=True, 
        handle_parsing_errors=True,
        max_iterations=12 # Increased slightly to allow for thorough synthesis
    )

    try:
        result = agent_executor.invoke({"input": user_query})
        return result["output"]
    except Exception as e:
        return f"Coordinator Error: {str(e)}. Please try a simpler request."