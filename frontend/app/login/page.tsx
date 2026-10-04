'use client';

import { Suspense, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApexToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';

/* ── Auth error → user-friendly message ─────────────────────────────────── */
const AUTH_ERRORS: Record<string, string> = {
  Configuration:        'Server configuration error. Please try again later.',
  AccessDenied:         'Access was denied. Please try a different account.',
  Verification:         'Sign-in link has expired. Please try again.',
  OAuthSignin:          'Could not start the sign-in flow. Please try again.',
  OAuthCallback:        'Could not complete sign-in. Please try again.',
  OAuthCreateAccount:   'Could not create your account. Please try again.',
  default:              'An error occurred during sign-in. Please try again.',
};

/* ── Google "G" logo — official brand colors ────────────────────────────── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-5 h-5 flex-shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ── Main login content ──────────────────────────────────────────────────── */
function LoginContent() {
  const searchParams   = useSearchParams();
  const { showWarn }   = useApexToast();
  const hasShownToast  = useRef(false);

  const errorCode   = searchParams.get('error');
  const unauthorized = searchParams.get('unauthorized') === '1';

  /* Unauthorized redirect toast (from middleware) */
  useEffect(() => {
    if (hasShownToast.current) return;
    if (unauthorized) {
      showWarn('Sign in required', 'Please sign in to access that page.');
      hasShownToast.current = true;
    }
  }, [unauthorized, showWarn]);

  /* Preserve exact auth call from original implementation */
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' });
  };

  const errorMessage = errorCode
    ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.default)
    : null;

  return (
    <main className="min-h-screen apex-hero-bg flex items-center justify-center pt-16 px-4 pb-8">

      {/* Soft ambient radial behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(30,43,92,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Animated glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
        className="relative z-10 apex-glass rounded-2xl p-8 w-full max-w-sm shadow-float text-center"
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl apex-indigo-bg flex items-center justify-center shadow-float">
            <span className="font-display font-bold text-2xl text-apex-gold leading-none select-none">
              A
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl text-apex-text-primary mb-2">
          Welcome back.
        </h1>
        <p className="text-sm text-apex-text-secondary mb-6">
          Sign in to access your travel concierge.
        </p>

        {/* Error badge — shown when next-auth returns an error */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-left mb-6"
            role="alert"
          >
            <i className="pi pi-exclamation-circle text-sm text-apex-error mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-red-700 leading-snug">{errorMessage}</p>
          </motion.div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6" aria-hidden="true">
          <div className="flex-1 h-px bg-slate-200/60" />
          <span className="text-xs text-apex-text-tertiary">continue with</span>
          <div className="flex-1 h-px bg-slate-200/60" />
        </div>

        {/* Google Sign-In button */}
        <motion.button
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl',
            'bg-white border border-slate-200 shadow-card',
            'text-sm font-semibold text-apex-text-primary',
            'hover:bg-apex-paper hover:border-slate-300 transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2'
          )}
          aria-label="Sign in with Google"
        >
          <GoogleIcon />
          Continue with Google
        </motion.button>

        {/* Terms */}
        <p className="mt-6 text-xs text-apex-text-tertiary leading-relaxed">
          By signing in, you agree to our{' '}
          <span className="underline underline-offset-2 cursor-pointer hover:text-apex-text-secondary transition-colors">
            terms of service
          </span>
          .
        </p>
      </motion.div>
    </main>
  );
}

/* ── Page export — Suspense required for useSearchParams in Next.js 15+ ── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen apex-hero-bg flex items-center justify-center pt-16">
          <div className="apex-glass rounded-2xl p-8 w-full max-w-sm shadow-float">
            {/* Skeleton while params resolve */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl apex-shimmer" />
            </div>
            <div className="apex-shimmer h-7 rounded-lg mb-3 w-40 mx-auto" />
            <div className="apex-shimmer h-4 rounded-md w-56 mx-auto mb-8" />
            <div className="apex-shimmer h-12 rounded-xl w-full" />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
