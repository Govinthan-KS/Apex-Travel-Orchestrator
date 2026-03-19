import sys
import os

# Adding the current directory to the path so Python doesn't get lost in its own house
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.coordinator_agent import run_coordinator_agent

def main():
    """
    The main entry point for the AI Travel Planner.
    This is the 'Front Desk' where the user drops off their travel dreams.
    """
    
    print("="*50)
    print("WELCOME TO THE AI TRAVEL PLANNER SQUAD")
    print("="*50)
    print("I can help you plan flights, hotels, and sights in one go.")
    print("Type 'exit' or 'quit' to stop the planner.")
    print("-" * 50)

    # THE INTERACTIVE LOOP
    # We keep the lights on until the user decides to leave.
    while True:
        # Taking the user's messy request
        user_input = input("\nWhere do you want to go? (e.g., '3 days in Tokyo, $200 budget'): \n> ")

        # Checking if the user is tired of planning and wants to go home
        if user_input.lower() in ['exit', 'quit', 'q']:
            print("\nSafe travels! Catch you on the next flight.")
            break

        if not user_input.strip():
            # If they just hit 'Enter', we don't bother the agents.
            print("You gotta tell me something! I can't plan a trip to Nowhere.")
            continue

        print("\nThe Coordinator is assembling the team... Please wait.\n")

        try:
            # Calling the 'General' to start the delegation chain
            # This is where the magic (and the 'Thought' loops) happens.
            itinerary = run_coordinator_agent(user_input)

            print("\n" + "="*50)
            print("YOUR CUSTOM ITINERARY")
            print("="*50)
            print(itinerary)
            print("="*50)

        except Exception as e:
            # If the entire agency collapses, we catch the debris here.
            print(f"\nOops! The Travel Agency hit a snag: {e}")
            print("Maybe try a simpler request?")

# THE ENGINE START
if __name__ == "__main__":
    # This ensures the party only starts if we run 'python main.py'
    main()