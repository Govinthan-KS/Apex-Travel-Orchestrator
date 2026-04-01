import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

/**
 * GET /api/db-test
 *
 * Temporary route to verify MongoDB connectivity.
 * Returns the connection state and host info on success.
 */
export async function GET() {
  try {
    const mongoose = await dbConnect();

    return NextResponse.json(
      {
        status: "ok",
        message: "✅ Connection Successful",
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        readyState: mongoose.connection.readyState, // 1 = connected
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        status: "error",
        message: "❌ Connection Failed",
        error: message,
      },
      { status: 500 }
    );
  }
}
