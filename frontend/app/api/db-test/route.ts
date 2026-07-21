import { NextResponse } from "next/server";

/**
 * This debug endpoint has been permanently removed.
 *
 * It previously returned MongoDB host and database name to unauthenticated
 * callers, which is an information disclosure vulnerability. Do not restore it.
 *
 * If you need to verify database connectivity during development, add
 * authentication or use a local script that never reaches the public internet.
 *
 * To fully remove this file, run:
 *   Remove-Item -Recurse -Force frontend/app/api/db-test
 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

