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
    <nav className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-40 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 text-slate-200 hover:text-white transition-colors group">
        <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-slate-950 group-hover:bg-lime-300 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.2)]">
          <i className="pi pi-bolt text-lg" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent">Apex</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-lime-400 transition-colors hidden sm:block">Home</Link>
        <Link href="/about" className="text-sm font-semibold text-slate-400 hover:text-lime-400 transition-colors hidden sm:block">About</Link>

        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-lime-400 transition-colors">Plan Trip</Link>
            
            <div className="w-px h-6 bg-slate-800" />
            
            <Link
              href="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 border border-slate-700 overflow-hidden hover:ring-2 hover:ring-lime-400/50 transition-all"
              title={session?.user?.name || "Profile"}
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <i className="pi pi-user text-lime-400" />
              )}
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-semibold hover:bg-slate-900 hover:border-slate-600 hover:text-slate-200 transition-colors"
            >
              <i className="pi pi-sign-out text-xs" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <div className="w-px h-6 bg-slate-800 hidden sm:block" />
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-slate-950 text-sm font-bold hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.15)] transition-all"
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
