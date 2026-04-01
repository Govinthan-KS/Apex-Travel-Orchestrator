/*
 * Middleware — middleware.ts
 * ==========================
 * This bouncer is stricter than my high school principal.
 * No session, no entry. Period.
 *
 * IMPORTANT: The matcher EXCLUDES _next internals, static files,
 * and /api/auth routes so we don't intercept the auth handshake
 * and cause an infinite login loop. That was a fun afternoon.
 *
 * The actual "should they be allowed in?" logic lives in
 * auth.config.ts → authorized() callback, not here.
 * We just tell Next.js WHICH routes to check.
 */

import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  /*
   * Only patrol these specific routes.
   * We MUST NOT match /api/auth/* or we'll intercept the OAuth
   * callback and create a redirect loop that'll make you question
   * your career choices.
   */
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ],
};
