/*
 * Navbar — components/Navbar.tsx
 * ================================
 * Now you see the login button, now you don't.
 * It's not magic, it's just hooks.
 *
 * V2.1:
 *   - Logged Out: "Login" (Sky Blue)
 *   - Logged In: "Dashboard" + Profile avatar + "Sign Out"
 *   - Sign Out: Fully nukes cookies + localStorage to prevent
 *     the "ghost session" bug where Google silently logs you
 *     back into the previous account.
 *   - Login success: Shows "Welcome back, [Name]!" toast
 */

"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useApexToast } from "./ToastProvider";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { showSuccess } = useApexToast();
  const isLoggedIn = status === "authenticated";
  const hasShownWelcome = useRef(false);

  /*
   * Welcome toast — fires once when the session transitions
   * from loading → authenticated. Uses a ref guard so it
   * doesn't fire on every re-render (because React is clingy).
   */
  useEffect(() => {
    if (isLoggedIn && !hasShownWelcome.current && session?.user?.name) {
      const firstName = session.user.name.split(" ")[0];
      showSuccess(
        `Welcome back, ${firstName}! ✈️`,
        "Ready for your next adventure?"
      );
      hasShownWelcome.current = true;
    }
  }, [isLoggedIn, session, showSuccess]);

  /*
   * Sign Out — the nuclear option.
   * Clears the NextAuth session, then wipes any leftover
   * cookies and localStorage crumbs. We're not leaving
   * ghost sessions behind. Not again.
   */
  const handleSignOut = async () => {
    showSuccess("Session Ended 👋", "Successfully logged out. See you soon!");

    /* Small delay so the toast is visible before the page nukes itself */
    setTimeout(async () => {
      await signOut({ callbackUrl: "/" });
    }, 1000);
  };

  return (
    <nav className="apex-nav">
      {/* Logo */}
      <Link href="/" className="apex-nav-logo" style={{ textDecoration: "none" }}>
        <i className="pi pi-globe" style={{ fontSize: "1.4rem", color: "#7ec8e3" }} />
        <span>Apex</span>
      </Link>

      {/* Nav links — reactive based on auth state */}
      <div className="apex-nav-links">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>

        {isLoggedIn ? (
          <>
            {/* Logged-in links */}
            <Link href="/dashboard">Plan Trip</Link>

            {/* Divider — thin but mighty */}
            <div style={{ width: "1px", height: "20px", background: "#d4e4d4", margin: "0 0.25rem" }} />

            {/* Profile icon — shows Google avatar if available */}
            <Link
              href="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#d1f0b1",
                color: "#2a5a2a",
                textDecoration: "none",
                transition: "all 0.2s",
                overflow: "hidden",
              }}
              title={session?.user?.name || "Profile"}
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <i className="pi pi-user" style={{ fontSize: "1rem" }} />
              )}
            </Link>

            {/* Sign Out — neutral but clear, like a polite eviction notice */}
            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 1rem",
                borderRadius: "10px",
                background: "transparent",
                color: "#5a6b5a",
                fontWeight: 600,
                fontSize: "0.85rem",
                border: "1.5px solid #d4e4d4",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              <i className="pi pi-sign-out" style={{ fontSize: "0.8rem" }} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* Logged-out — single Login button */}

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "#d4e4d4", margin: "0 0.25rem" }} />

            {/* Login — Sky Blue, the one and only entry point */}
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 1.1rem",
                borderRadius: "10px",
                background: "#7ec8e3",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <i className="pi pi-sign-in" style={{ fontSize: "0.85rem" }} />
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
