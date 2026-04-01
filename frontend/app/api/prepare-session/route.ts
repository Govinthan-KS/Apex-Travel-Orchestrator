import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Survey from "@/models/Survey";
import FrequencyWeight from "@/models/FrequencyWeight";
import crypto from "crypto";

/**
 * GET /api/prepare-session
 *
 * The "Logistics DNA" bridge — aggregates the authenticated user's
 * Survey (Hard Constraints) and FrequencyWeight (Soft Preferences)
 * into a signed JSON payload for the Python backend.
 *
 * V2: Now includes HMAC-SHA256 signature for backend verification.
 */
export async function GET() {
  /* ── 1. Authentication ── */
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "You must be signed in." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    await dbConnect();

    /* ── 2. Data Aggregation ── */
    const [survey, frequencyWeight] = await Promise.all([
      Survey.findOne({ userId }).lean(),
      FrequencyWeight.findOne({ userId }).lean(),
    ]);

    /* ── 3. Onboarding Guard ── */
    if (!survey) {
      return NextResponse.json(
        {
          error: "OnboardingIncomplete",
          message:
            "You haven't completed the onboarding survey yet. Please visit /onboarding to set up your travel profile.",
          redirect: "/onboarding",
        },
        { status: 404 }
      );
    }

    /* ── 4. Format Logistics DNA ── */
    // Convert Mongoose Map / POJO to plain objects
    const flightClassWeights: Record<string, number> =
      frequencyWeight?.flightClass instanceof Map
        ? Object.fromEntries(frequencyWeight.flightClass)
        : (frequencyWeight?.flightClass as unknown as Record<string, number>) ?? {};

    const stayTierWeights: Record<string, number> =
      frequencyWeight?.stayTier instanceof Map
        ? Object.fromEntries(frequencyWeight.stayTier)
        : (frequencyWeight?.stayTier as unknown as Record<string, number>) ?? {};

    const interestsWeights: Record<string, number> =
      frequencyWeight?.interests instanceof Map
        ? Object.fromEntries(frequencyWeight.interests)
        : (frequencyWeight?.interests as unknown as Record<string, number>) ?? {};

    // Extract interest names with weight > 0 as an array
    const activeInterests = Object.entries(interestsWeights)
      .filter(([, weight]) => weight > 0)
      .map(([name]) => name);

    const logisticsDna = {
      user_id: userId,
      constraints: {
        dietary: survey.dietary ? [survey.dietary] : [],
        home_hub: survey.homeHub,
        accessibility: survey.accessibility ?? [],
        travel_pace: survey.travelPace ?? "moderate",
      },
      weights: {
        flight_class: flightClassWeights,
        stay_tier: stayTierWeights,
        interests: activeInterests,
      },
      metadata: {
        last_login: new Date().toISOString(),
        version: "v2.0",
      },
    };

    /* ── 5. HMAC Signature ── */
    const sharedSecret = process.env.INTERNAL_SHARED_SECRET ?? "";
    let signature = "";

    if (sharedSecret) {
      // Canonical JSON: sorted keys, no whitespace — matches Python's json.dumps(sort_keys=True, separators=(",",":"))
      const canonical = JSON.stringify(logisticsDna, Object.keys(logisticsDna).sort());
      // For deterministic output matching Python, use a stable serializer
      const stableCanonical = stableStringify(logisticsDna);
      signature = crypto
        .createHmac("sha256", sharedSecret)
        .update(stableCanonical)
        .digest("hex");
    }

    return NextResponse.json(
      { dna: logisticsDna, signature },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 }
    );
  }
}

/**
 * Stable JSON stringify with sorted keys (recursive).
 * Matches Python's json.dumps(obj, sort_keys=True, separators=(",", ":"))
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "number" || typeof obj === "boolean") return JSON.stringify(obj);
  if (typeof obj === "string") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]";
  }
  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(
      (key) => JSON.stringify(key) + ":" + stableStringify((obj as Record<string, unknown>)[key])
    );
    return "{" + pairs.join(",") + "}";
  }
  return String(obj);
}
