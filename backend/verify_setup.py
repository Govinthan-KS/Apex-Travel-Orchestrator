"""
Quick sanity check — run with: python verify_setup.py
Tests:
  1. LangChain imports (checks core/agents compatibility after upgrade)
  2. compound-beta model via Groq
  3. gemini-2.0-flash model via Google AI Studio
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 55)
print("Apex Backend — Setup Verification")
print("=" * 55)

# ── Check 1: LangChain imports ──
print("\n[1/3] Testing LangChain imports...")
try:
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain_groq import ChatGroq
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage
    print("      OK — all imports successful")
except ImportError as e:
    print(f"      FAIL — {e}")
    print("      Fix: pip install 'langchain>=0.2,<0.3' 'langchain-core>=0.2,<0.3'")
    exit(1)

# ── Check 2: Groq compound-beta ──
print("\n[2/3] Testing Groq compound-beta model...")
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("      SKIP — GROQ_API_KEY not found in .env")
else:
    try:
        llm = ChatGroq(
            groq_api_key=groq_key,
            model_name="compound-beta",
            temperature=0,
        )
        response = llm.invoke([HumanMessage(content="Reply with exactly one word: OK")])
        print(f"      OK — compound-beta responded: '{response.content.strip()}'")
    except Exception as e:
        err = str(e)
        if "model" in err.lower() and ("not found" in err.lower() or "invalid" in err.lower()):
            print(f"      WARN — 'compound-beta' not found. Try model name 'compound'")
            print(f"      Raw error: {err[:120]}")
        else:
            print(f"      FAIL — {err[:150]}")

# ── Check 3: Google Gemini — try flash models in preference order ──
print("\n[3/3] Finding working Gemini Flash model...")
google_key = os.getenv("GOOGLE_API_KEY")
if not google_key:
    print("      SKIP — GOOGLE_API_KEY not found in .env")
else:
    # Preference order: best RPD first (lite variants have 500 RPD vs 20 RPD on full flash)
    candidates = [
        "gemini-3.5-flash-lite",   # 15 RPM / 500 RPD ← target
        "gemini-3.1-flash-lite",   # 15 RPM / 500 RPD ← fallback
        "gemini-3.5-flash",        # 5 RPM  / 20 RPD  ← last resort
        "gemini-2.0-flash",        # backup
        "gemini-flash-latest",     # alias fallback
    ]
    working_model = None
    for candidate in candidates:
        try:
            llm = ChatGoogleGenerativeAI(
                model=candidate,
                google_api_key=google_key,
                temperature=0,
            )
            response = llm.invoke([HumanMessage(content="Reply with exactly one word: OK")])
            print(f"      OK — {candidate} responded: '{response.content.strip()}'")
            working_model = candidate
            break
        except Exception as e:
            err = str(e)
            if "404" in err or "deprecated" in err.lower() or "no longer available" in err.lower():
                print(f"      SKIP — {candidate} (deprecated/unavailable)")
            else:
                print(f"      FAIL — {candidate}: {err[:100]}")
                break

    if working_model:
        print(f"\n      >>> Set SUB_AGENT_MODEL = \"{working_model}\" in config.py <<<")
    else:
        print("\n      FAIL — no working flash model found on this key")

print("\n" + "=" * 55)
print("Done. Fix any FAIL items above before running the backend.")
print("=" * 55)

