"use client";

import { useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useApexToast } from "@/components/ToastProvider";

function LoginContent() {
  const searchParams = useSearchParams();
  const { showWarn } = useApexToast();
  const hasShownToast = useRef(false);

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

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" }, { prompt: "select_account" });
  };

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-slate-800 text-center relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-lime-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(163,230,53,0.15)]">
            <i className="pi pi-bolt text-3xl text-slate-950" />
          </div>

          <h1 className="text-3xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 mb-8 font-medium">
            Sign in to start planning your next adventure
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8" />

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:bg-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95"
          >
            <i className="pi pi-google" />
            Sign in with Google
          </button>

          <p className="text-slate-500 text-sm mt-8 leading-relaxed">
            By signing in you agree to let our AI agents <br /> orchestrate your travel dreams.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-500 bg-slate-950 min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
