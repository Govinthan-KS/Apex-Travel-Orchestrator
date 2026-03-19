from langchain_core.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from tools.attraction_tools import search_attractions
from config import GROQ_API_KEY, MODEL_NAME, TEMPERATURE

def run_attraction_agent(query: str) -> str:
    """
    Initializes and executes the sightseeing agent with strict termination rules.
    """
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY, 
        model_name=MODEL_NAME, 
        temperature=TEMPERATURE
    )

    tools = [search_attractions]

    # STICK TO THE PLAN
    # We enforce a one-and-done policy for tool usage.
    template = """You are a Senior Attractions Specialist. 
    Your goal is to list landmarks for a city based on the user's request.
    
    You have access to the following tools:
    {tools}

    STRICT GUIDELINES:
    1. Use the search_attractions tool EXACTLY once.
    2. Extract ONLY the city name for the tool input (e.g., 'London' not 'things to do in London').
    3. Once you see the 'Observation', you must immediately provide your 'Final Answer'.
    4. Do NOT repeat thoughts or actions. 
    5. Do NOT use emojis.

    Use this format:
    Thought: I need to find attractions for the requested city.
    Action: the action to take, must be one of [{tool_names}]
    Action Input: The city name only
    Observation: The tool output
    Thought: I have the data. I will now provide the final answer.
    Final Answer: A summary of the attractions found.

    Begin!
    Question: {input}
    Thought: {agent_scratchpad}"""

    prompt = PromptTemplate.from_template(template)
    
    agent = create_react_agent(llm, tools, prompt)
    
    # max_iterations=3 gives it a tiny bit more breathing room if it needs to re-parse.
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
    except Exception:
        # Returning a more 'CEO-friendly' error message
        return "I encountered an issue retrieving attractions for this location. Please explore local landmarks manually."

# Unit Test
if __name__ == "__main__":
    test_query = "What are the best things to see in Chennai?"
    print("\nTesting our Attraction Agent")
    print(run_attraction_agent(test_query))