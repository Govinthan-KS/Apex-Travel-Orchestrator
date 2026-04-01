"""
Apex Travel Orchestrator v2 — Backend API Server

FastAPI application serving:
  - POST /api/v2/sync-vibe  → Upsert a user's travel vibe to Pinecone
  - GET  /api/v2/context     → Get augmented context (DNA + Memories)
  - CLI mode via `python main.py --cli`

The original CLI coordinator loop is preserved as a CLI sub-command.
"""

import sys
import os
import logging
import argparse

# Adding the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from memory_store import upsert_user_vibe, retrieve_relevant_vibes
from brain_hook import get_augmented_context
from agents.coordinator_agent import run_coordinator_agent
from auth_utils import verify_signature

# Logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("apex-backend")

# FastAPI App

app = FastAPI(
    title="Apex Travel Orchestrator v2 — Backend API",
    description="Semantic memory layer & AI agent orchestration",
    version="2.0.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request / Response Models

class SyncVibeRequest(BaseModel):
    user_id: str
    vibe_text: str


class SyncVibeResponse(BaseModel):
    status: str
    vector_id: str
    message: str


class ContextRequest(BaseModel):
    user_id: str
    query: str
    top_k: int = 3


class ContextResponse(BaseModel):
    user_id: str
    context: str
    memory_count: int


class PlanRequest(BaseModel):
    user_id: str
    query: str
    dna: Optional[dict] = None  # Logistics DNA from frontend /api/prepare-session
    start_date: Optional[str] = None


class PlanResponse(BaseModel):
    status: str
    user_id: str
    itinerary: str

# API Endpoints

@app.get("/")
async def root():
    return {
        "service": "Apex Travel Orchestrator v2",
        "version": "2.0.0",
        "endpoints": [
            "POST /api/v2/sync-vibe",
            "POST /api/v2/context",
            "POST /api/v2/plan",
        ],
    }


@app.post("/api/v2/sync-vibe", response_model=SyncVibeResponse)
async def sync_vibe(req: SyncVibeRequest):
    """
    Upsert a travel "vibe" (preference / memory) into Pinecone.

    The vibe is vectorized locally using all-MiniLM-L6-v2 and stored
    in the user's namespace for strict data isolation.
    """
    if not req.user_id or not req.vibe_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Both user_id and vibe_text are required.",
        )

    try:
        result = upsert_user_vibe(req.user_id, req.vibe_text.strip())
        return SyncVibeResponse(
            status="ok",
            vector_id=result["id"],
            message=f"Vibe stored successfully in namespace '{req.user_id}'.",
        )
    except Exception as e:
        logger.error("sync-vibe error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/context", response_model=ContextResponse)
async def get_context(req: ContextRequest):
    """
    Get augmented context combining Logistics DNA + Semantic Memories.

    This is the payload injected into the Llama 3.3 70b system prompt
    for personalized travel recommendations.
    """
    if not req.user_id or not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Both user_id and query are required.",
        )

    try:
        context = get_augmented_context(
            user_id=req.user_id,
            query=req.query.strip(),
            top_k=req.top_k,
        )
        # Count memories in context
        memory_count = context.count("Memory ")
        return ContextResponse(
            user_id=req.user_id,
            context=context,
            memory_count=memory_count,
        )
    except Exception as e:
        logger.error("context error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/plan", response_model=PlanResponse)
async def plan_trip(
    req: PlanRequest,
    x_apex_signature: Optional[str] = Header(None),
):
    """
    Plan a personalized trip using the Context-Aware Strategic Orchestrator.

    HMAC Signature Verification:
      The frontend signs the DNA payload with HMAC-SHA256 using a shared secret.
      This endpoint verifies the signature before spending Groq credits.
    """
    if not req.user_id or not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Both user_id and query are required.",
        )

    # Date Boundary Validation: Max 21 days
    if req.start_date:
        import datetime
        try:
            start_date_obj = datetime.datetime.fromisoformat(req.start_date.replace("Z", "+00:00"))
            max_allowed = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=21)
            
            if start_date_obj.date() > max_allowed.date():
                raise HTTPException(
                    status_code=400,
                    detail="Server Validation Error: Trips can only be scheduled up to 21 days in advance."
                )
        except ValueError:
            pass # Invalid format, ignore for now

    # HMAC Guard — verify DNA signature before burning Groq credits
    shared_secret = os.getenv("INTERNAL_SHARED_SECRET", "")
    if shared_secret and req.dna:
        if not x_apex_signature:
            raise HTTPException(
                status_code=403,
                detail="Missing X-Apex-Signature header. Access denied.",
            )
        if not verify_signature(req.dna, x_apex_signature):
            logger.warning("Invalid HMAC signature for user %s", req.user_id)
            raise HTTPException(
                status_code=403,
                detail="Invalid signature. Access denied to protect API credits.",
            )
        logger.info("HMAC signature verified for user %s", req.user_id)

    try:
        logger.info("Planning trip for user %s: '%s'", req.user_id, req.query[:60])
        itinerary = run_coordinator_agent(req.user_id, req.query.strip(), dna=req.dna)
        return PlanResponse(
            status="ok",
            user_id=req.user_id,
            itinerary=itinerary,
        )
    except Exception as e:
        logger.error("plan error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

# CLI Mode (preserved from v1, og vibes)

def run_cli():
    """The v2 interactive CLI with user_id context support."""
    print("=" * 50)
    print("WELCOME TO THE APEX TRAVEL ORCHESTRATOR v2")
    print("=" * 50)
    print("I can help you plan flights, hotels, and sights in one go.")
    print("Now with personalized context from your travel profile!")
    print("-" * 50)

    user_id = input("\nEnter your User ID (from MongoDB): \n> ").strip()
    if not user_id:
        user_id = "anonymous"
        print("No user ID provided — running in anonymous mode (no personalization).")

    print(f"Context loaded for user: {user_id}")
    print("Type 'exit' or 'quit' to stop the planner.")
    print("-" * 50)

    while True:
        user_input = input(
            "\nWhere do you want to go? (e.g., '3 days in Tokyo, $200 budget'): \n> "
        )

        if user_input.lower() in ["exit", "quit", "q"]:
            print("\nSafe travels! Catch you on the next flight.")
            break

        if not user_input.strip():
            print("You gotta tell me something! I can't plan a trip to Nowhere.")
            continue

        print("\nThe Strategic Orchestrator is assembling the team... Please wait.\n")

        try:
            itinerary = run_coordinator_agent(user_id, user_input, dna=None)
            print("\n" + "=" * 50)
            print("YOUR PERSONALIZED ITINERARY")
            print("=" * 50)
            print(itinerary)
            print("=" * 50)
        except Exception as e:
            print(f"\nOops! The Travel Agency hit a snag: {e}")
            print("Maybe try a simpler request?")

# Entry Point

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apex Travel Orchestrator v2")
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Run in interactive CLI mode (v1 behavior)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for the FastAPI server (default: 8000)",
    )

    args = parser.parse_args()

    if args.cli:
        run_cli()
    else:
        import uvicorn
        print(f"\n🚀 Starting Apex Backend API on http://localhost:{args.port}")
        print("   Docs → http://localhost:{}/docs".format(args.port))
        uvicorn.run(app, host="0.0.0.0", port=args.port)