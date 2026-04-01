/*
 * Auth.js v5 — Full Configuration (Node.js Runtime)
 * ====================================================
 * Merges the Edge-safe config (providers, callbacks) with the
 * MongoDB Adapter. This file is used by:
 *   - app/api/auth/[...nextauth]/route.ts
 *   - Server components that call auth()
 *
 * It is NOT imported by middleware.ts (Edge Runtime) because
 * MongoDB would make the Edge Runtime cry.
 *
 * V2.3 — SIMPLIFIED:
 * Removed the needsOnboarding JWT flag. It kept breaking due to
 * ObjectId vs string mismatches. The onboarding check is now
 * handled by /api/check-onboarding (a direct Mongoose query).
 * Sometimes the simplest solution is just a fetch() call.
 */

import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  ...authConfig,

  callbacks: {
    /*
     * JWT Callback — attach user.id to the token.
     * That's it. No survey checks, no needsOnboarding flags,
     * no ObjectId drama. We learned our lesson.
     */
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    /*
     * Session Callback — expose user.id to the client.
     */
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    /* authorized callback handles route protection */
    authorized: authConfig.callbacks.authorized,

    /*
     * signIn Callback — ALWAYS return true.
     * Returning a string is a DENIAL. Never again.
     */
    async signIn() {
      return true;
    },
  },
});
