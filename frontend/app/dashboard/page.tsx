'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApexToast } from '@/components/ToastProvider';

import { TripPlannerCard }    from '@/components/planner/TripPlannerCard';
import { PlannerLoadingState } from '@/components/planner/PlannerLoadingState';
import { ItineraryResult }    from '@/components/planner/ItineraryResult';

import { executePlanTrip }    from '@/lib/planTrip';
import { BACKEND_URL }        from '@/lib/constants';
import type { TimelineEvent } from '@/lib/planTrip';
import type { PlanFormValues } from '@/components/planner/TripPlannerCard';

/* ── Phase state ──────────────────────────────────────────────────────────── */
type Phase = 'form' | 'loading' | 'result';

/* ─────────────────────────────────────────────────────────────────────────────
   Dashboard Page — orchestrates all 3 planner phases
───────────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router                   = useRouter();
  const { showError, showSuccess } = useApexToast();

  const [phase,      setPhase]      = useState<Phase>('form');
  const [events,     setEvents]     = useState<TimelineEvent[]>([]);
  const [formValues, setFormValues] = useState<PlanFormValues | null>(null);

  /* ── Onboarding guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/check-onboarding')
      .then((res) => res.json())
      .then((data) => {
        if (data.needsOnboarding) router.replace('/onboarding');
      })
      .catch(() => {});
  }, [status, router]);

  /* ── Plan trip handler ────────────────────────────────────────────────── */
  const handlePlanTrip = useCallback(async (values: PlanFormValues) => {
    setFormValues(values);
    setPhase('loading');

    try {
      const result = await executePlanTrip({ ...values, backendUrl: BACKEND_URL });
      setEvents(result);
      setPhase('result');
      showSuccess('Itinerary ready.', 'Your personalised trip plan has been generated.');
    } catch (err) {
      showError(
        'Planning failed.',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setPhase('form');
    }
  }, [showError, showSuccess]);

  /* ── Reset to form ────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setEvents([]);
    setFormValues(null);
    setPhase('form');
  }, []);

  /* ── Greeting ─────────────────────────────────────────────────────────── */
  const firstName = session?.user?.name?.split(' ')[0];

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen apex-hero-bg pt-16">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Greeting header — visible only on the form phase ────────── */}
        <AnimatePresence>
          {phase === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mb-7"
            >
              <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-[0.15em] mb-1">
                {getGreeting()},
              </p>
              <h1 className="font-display text-3xl text-apex-text-primary">
                {firstName ? `${firstName}.` : 'Ready to plan?'}
              </h1>
              <p className="text-sm text-apex-text-secondary mt-2">
                Tell us where you want to go — Apex handles the rest.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase A: Planner form ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <TripPlannerCard onSubmit={handlePlanTrip} />
            </motion.div>
          )}

          {/* ── Phase B: Loading ─────────────────────────────────────── */}
          {phase === 'loading' && formValues && (
            <motion.div key="loading">
              <PlannerLoadingState destination={formValues.destination} />
            </motion.div>
          )}

          {/* ── Phase C: Result ──────────────────────────────────────── */}
          {phase === 'result' && events.length > 0 && formValues && (
            <motion.div key="result">
              <ItineraryResult
                events={events}
                destination={formValues.destination}
                budget={formValues.budget}
                pace={formValues.pace}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: time-of-day greeting
───────────────────────────────────────────────────────────────────────────── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
