import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

/*
 * GET /api/trips
 * Fetches the authenticated user's saved trips.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch trips sorted by newest first
    const trips = await Trip.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ trips });
  } catch (err: unknown) {
    console.error("GET /api/trips error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trips." },
      { status: 500 }
    );
  }
}

/*
 * POST /api/trips
 * Saves a successfully generated trip to the user's history.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    if (!data.destination || !data.budget || !data.days || !data.itinerary) {
      return NextResponse.json(
        { error: "Missing required trip fields." },
        { status: 400 }
      );
    }

    await dbConnect();

    const trip = await Trip.create({
      userId: session.user.id,
      destination: data.destination,
      budget: data.budget,
      days: data.days,
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }), // e.g. "March 2026"
      itinerary: data.itinerary,
    });

    return NextResponse.json({ success: true, tripId: trip._id });
  } catch (err: unknown) {
    console.error("POST /api/trips error:", err);
    return NextResponse.json(
      { error: "Failed to save trip." },
      { status: 500 }
    );
  }
}
