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

  const handleSignOut = async () => {
    showSuccess("Session Ended 👋", "Successfully logged out. See you soon!");
    setTimeout(async () => {
      await signOut({ callbackUrl: "/" });
    }, 1000);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-slate-900 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <i className="pi pi-globe text-lg" />
        </div>
        <span className="font-extrabold text-xl tracking-tight">Apex</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Home</Link>
        <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">About</Link>

        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Plan Trip</Link>
            
            <div className="w-px h-6 bg-slate-200" />
            
            <Link
              href="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all"
              title={session?.user?.name || "Profile"}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <i className="pi pi-user text-slate-500" />
              )}
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <i className="pi pi-sign-out text-xs" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <i className="pi pi-sign-in text-xs" />
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
