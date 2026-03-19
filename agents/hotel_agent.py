from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from tools.hotel_tools import search_hotels
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE

def run_hotel_agent(query: str) -> str:
    """
    Initializes and executes a specialized hotel-finding agent.
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY, 
        model_name=MODEL_NAME, 
        temperature=TEMPERATURE
    )

    tools = [search_hotels]

    # THE HOTEL SPECIALIST HANDBOOK
    # We enforce strict parameter extraction for the search_hotels tool.
    template = """You are a dedicated Hotel Specialist Agent named Gary. 
    Your sole responsibility is to find accommodations based on city, budget, and date.
    
    You have access to the following tool:
    {tools}

    STRICT GUIDELINES:
    1. EXTRACT DATA: Extract the City, Max Budget (as a number), and Date (YYYY-MM-DD).
    2. TOOL INPUT: Your 'Action Input' MUST be a comma-separated list: 'City, Budget, Date'.
       Example: Action Input: Tokyo, 200, 2026-05-15
    3. NO EMOJIS: Keep the report professional and text-only.
    4. ACCURACY: If a city is not found in the database, simply state "No hotels found in [City]". Do NOT switch to another city.

    Follow this format:
    Thought: I need to extract the city and budget from the request.
    Action: [{tool_names}]
    Action Input: City, Budget, Date
    Observation: the result of the tool
    Thought: I have the hotel and weather details.
    Final Answer: A summary including hotel name, price, area, and the weather forecast.

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
        max_iterations=3 # Gary is fast; 3 tries is plenty.
    )

    try:
        result = agent_executor.invoke({"input": query})
        return result["output"]
    except Exception:
        return "I encountered an issue finding hotels for this location. Please check availability manually."

if __name__ == "__main__":
    test_query = "Find me a hotel in Chennai for under $150 on 2026-05-15"
    print("\nTesting Hotel Agent...")
    print(run_hotel_agent(test_query))