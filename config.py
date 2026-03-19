import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
OPENTRIPMAP_API_KEY = os.getenv("OPENTRIPMAP_API_KEY")

# Model Settings
MODEL_NAME = "llama-3.3-70b-versatile"
TEMPERATURE = 0  # We want facts, not creative hallucinations
MAX_ITERATIONS = 15
MAX_RESULTS = 5