/*
 * Auth Config — auth.config.ts (Edge-Safe)
 * ==========================================
 * The brain behind authentication decisions.
 * This file runs on the Edge Runtime (middleware), so
 * NO MongoDB adapter allowed here — that lives in lib/auth.ts.
 *
 * This bouncer is stricter than my high school principal.
 * No session, no entry to protected routes.
 *
 * V2.1 — FIXES:
 *   - Google provider now forces "select_account" prompt so users
 *     can switch between Gmail accounts without being silently
 *     logged into the cached one. We learned this lesson at 3am.
 */

import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      /*
       * Force the Google account picker every single time.
       * Without this, if a user logs out and logs back in,
       * Google silently picks the last account. That's not
       * "switching accounts," that's "being haunted by your
       * previous session." Not cool, Google. Not cool.
       */
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Attach MongoDB user._id to the JWT.
     */
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * Expose user.id on the client-side session object.
     */
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    /**
     * The Bouncer — authorized() callback
     *
     * Protected route + no session → redirect to /login?unauthorized=1
     * Everything else → let them through
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/onboarding");

      if (isProtected && !isLoggedIn) {
        /*
         * Explicitly redirect with ?unauthorized=1 so the login page
         * knows this was a bouncer redirect, NOT a normal sign-in flow.
         */
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("unauthorized", "1");
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
