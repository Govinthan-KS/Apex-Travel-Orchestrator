"use server";

import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Survey from "@/models/Survey";
import FrequencyWeight from "@/models/FrequencyWeight";

/* ── Form Data Shape ── */
export interface OnboardingData {
  /* Step 1 — Hard Constraints */
  dietary: string;
  homeHub: string;
  accessibility: string[];
  /* Step 2 — Soft Preferences */
  travelPace: string;
  flightClass: string;
  stayTier: string;
  interests: string[];
}

export async function submitOnboarding(
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  /* ── 1. Get authenticated user ── */
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized — you must be signed in." };
  }

  const userId = session.user.id;

  try {
    await dbConnect();

    /* ── 2. Save Hard Constraints → Survey ── */
    await Survey.findOneAndUpdate(
      { userId },
      {
        userId,
        dietary: data.dietary || "none",
        homeHub: data.homeHub,
        accessibility: data.accessibility ?? [],
        travelPace: data.travelPace || "moderate",
      },
      { upsert: true, returnDocument: "after" }
    );

    /* ── 3. Initialize Soft Preferences → FrequencyWeight ── */
    const flightClassMap: Record<string, number> = {
      economy: 0,
      premium_economy: 0,
      business: 0,
      first: 0,
    };
    if (data.flightClass && data.flightClass in flightClassMap) {
      flightClassMap[data.flightClass] = 1.0;
    }

    const stayTierMap: Record<string, number> = {
      budget: 0,
      mid_range: 0,
      luxury: 0,
      resort: 0,
    };
    if (data.stayTier && data.stayTier in stayTierMap) {
      stayTierMap[data.stayTier] = 1.0;
    }

    const interestsMap: Record<string, number> = {
      culture: 0,
      adventure: 0,
      food: 0,
      nightlife: 0,
      nature: 0,
      shopping: 0,
      relaxation: 0,
    };
    for (const interest of data.interests ?? []) {
      if (interest in interestsMap) {
        interestsMap[interest] = 1.0;
      }
    }

    await FrequencyWeight.findOneAndUpdate(
      { userId },
      {
        userId,
        flightClass: flightClassMap,
        stayTier: stayTierMap,
        interests: interestsMap,
      },
      { upsert: true, returnDocument: "after" }
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
