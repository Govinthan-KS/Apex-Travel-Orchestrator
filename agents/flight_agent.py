from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from tools.flight_tools import search_flights
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE

def run_flight_agent(query: str) -> str:
    """
    Initializes and executes a specialized flight-finding agent.
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY, 
        model_name=MODEL_NAME, 
        temperature=TEMPERATURE
    )

    tools = [search_flights]

    # THE FLIGHT SPECIALIST HANDBOOK
    # Added strict instructions on how to format the Action Input.
    template = """You are a dedicated Flight Specialist Agent. 
    Your sole responsibility is to find flight schedules and routes.
    
    You have access to the following tool:
    {tools}

    STRICT GUIDELINES:
    1. EXTRACT DATA: You must extract Departure City, Arrival City, and Date (YYYY-MM-DD).
    2. DEFAULTS: If the user didn't specify a departure city, use 'Delhi'. 
    3. TOOL INPUT: Your 'Action Input' MUST be a comma-separated list: 'Departure, Arrival, Date'.
       Example: Action Input: Delhi, Tokyo, 2026-05-15
    4. NO Hallucinations: If the tool finds no flights, simply state that no flights are available.
    5. NO EMOJIS: Keep the report professional and text-only.

    Follow this format:
    Thought: I need to extract the travel details.
    Action: [{tool_names}]
    Action Input: Departure, Arrival, Date
    Observation: the result of the action
    Thought: I have the flight details.
    Final Answer: A clear summary of airline names, flight numbers, and status.

    Begin!
    Question: {input}
    Thought: {agent_scratchpad}"""

    prompt = PromptTemplate.from_template(template)
    
    agent = create_react_agent(llm, tools, prompt)
    
    # max_iterations=3 is usually enough for a flight search.
    agent_executor = AgentExecutor(
        agent=agent, 
        tools=tools, 
        verbose=True, 
        handle_parsing_errors=True,
        max_iterations=3 
    )

    try:
        result = agent_executor.invoke({"input": query})
        return result["output"]
    except Exception as e:
        return "I encountered an error while searching for flights. Please check the schedule manually."

# Unit Test
if __name__ == "__main__":
    test_query = "Find me a flight from Chennai to Tokyo on 2026-05-15"
    print("\nTesting Flight Agent...")
    print(run_flight_agent(test_query))