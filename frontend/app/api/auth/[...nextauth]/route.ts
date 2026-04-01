import { handlers } from "@/lib/auth";

/**
 * Auth.js v5 API Route
 *
 * Handles all /api/auth/* endpoints:
 *   - /api/auth/signin
 *   - /api/auth/signout
 *   - /api/auth/callback/google
 *   - /api/auth/session
 *   etc.
 */
export const { GET, POST } = handlers;
