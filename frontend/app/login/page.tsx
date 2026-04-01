/*
 * Login Page — login/page.tsx
 * ============================
 * The velvet rope of the Apex Travel club.
 *
 * V2.2 — FIXES:
 *   - Google signIn now passes `prompt: "select_account"` as the 3rd
 *     argument to force the Google account picker. Previously it was
 *     only in the provider config which wasn't working reliably.
 *   - Unauthorized toast uses ?unauthorized=1 param detection
 */

"use client";

import { useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { useApexToast } from "@/components/ToastProvider";

function LoginContent() {
  const searchParams = useSearchParams();
  const { showWarn } = useApexToast();
  const hasShownToast = useRef(false);

  /*
   * Unauthorized access toast — only fires when the middleware
   * bouncer redirected the user here with ?unauthorized=1.
   */
  useEffect(() => {
    if (hasShownToast.current) return;

    const unauthorized = searchParams.get("unauthorized");
    if (unauthorized === "1") {
      showWarn(
        "Access Denied 🔒",
        "Please login to plan your trip."
      );
      hasShownToast.current = true;
    }
  }, [searchParams, showWarn]);

  /*
   * Google Sign-In handler.
   *
   * THE FIX: The 3rd argument `{ prompt: "select_account" }` forces
   * Google to show the account picker every time. Without this,
   * Google caches the last signed-in account and silently reuses it
   * even after the user logged out. The "ghost account" bug.
   *
   * The 2nd argument is the NextAuth options (callbackUrl).
   * The 3rd argument is passed as authorization params to Google's OAuth.
   */
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" }, { prompt: "select_account" });
  };

  return (
    <main
      className="flex align-items-center justify-content-center"
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "2rem",
        background: "linear-gradient(135deg, #f8fdf4 0%, #e8f8d8 40%, #c4e8f5 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          borderRadius: "20px",
          border: "2px solid #d1f0b140",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 8px 40px rgba(126, 200, 227, 0.15)",
          padding: "3rem 2.5rem",
          textAlign: "center",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7ec8e3, #a3d980)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 4px 20px rgba(126, 200, 227, 0.35)",
          }}
        >
          <i className="pi pi-globe" style={{ fontSize: "2rem", color: "#ffffff" }} />
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1a2e1a", margin: 0 }}>
          Welcome Back
        </h1>
        <p style={{ color: "#5a6b5a", fontSize: "1rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
          Sign in to start planning your next adventure
        </p>

        {/* ── Lime divider ── */}
        <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, #d1f0b1, transparent)", marginBottom: "2rem" }} />

        {/* ── Google Sign-In — forces account picker via 3rd arg ── */}
        <Button
          label="Sign in with Google"
          icon="pi pi-google"
          size="large"
          className="w-full"
          onClick={handleGoogleSignIn}
          style={{
            padding: "1rem 1.5rem",
            fontSize: "1.1rem",
            background: "linear-gradient(135deg, #7ec8e3, #5bb8d9)",
            borderColor: "transparent",
            borderRadius: "12px",
            fontWeight: 700,
            boxShadow: "0 4px 16px rgba(126, 200, 227, 0.35)",
          }}
        />

        <p style={{ color: "#8a9b8a", fontSize: "0.8rem", marginTop: "1.5rem", lineHeight: 1.5 }}>
          By signing in you agree to let four AI agents
          <br />
          orchestrate your travel dreams.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
