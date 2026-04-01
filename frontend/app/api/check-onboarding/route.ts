/*
 * Check Onboarding API — /api/check-onboarding/route.ts
 * =======================================================
 * The simplest, most bulletproof way to check if a user
 * has completed their Travel DNA onboarding.
 *
 * Why this exists instead of the JWT flag approach:
 *   - JWT flags require ObjectId ↔ string conversion (broke twice)
 *   - Session serialization can strip custom properties
 *   - This is one fetch(), one DB query, zero type-casting nonsense
 *
 * Called by the dashboard on mount. Returns { needsOnboarding: boolean }.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Survey from "@/models/Survey";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ needsOnboarding: false, error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    /*
     * Use the Mongoose model directly — same model that writes the survey.
     * No ObjectId vs string mismatch possible because Mongoose handles
     * the type casting internally. This is why we don't use the raw
     * MongoDB driver here. Learned that lesson the hard way.
     */
    const survey = await Survey.findOne(
      { userId: session.user.id },
      { _id: 1 }
    ).lean();

    return NextResponse.json({ needsOnboarding: !survey });
  } catch (err) {
    console.error("check-onboarding error:", err);
    /* If anything breaks, don't block the user — let them through */
    return NextResponse.json({ needsOnboarding: false });
  }
}
