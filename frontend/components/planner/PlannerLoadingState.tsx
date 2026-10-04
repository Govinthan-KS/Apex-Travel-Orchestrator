'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOADING_MESSAGES } from '@/lib/constants';

const AGENTS = [
  { label: 'Flight Intelligence', icon: 'pi-send',     color: 'text-apex-indigo bg-apex-indigo-soft' },
  { label: 'Hotel Curation',      icon: 'pi-building', color: 'text-apex-gold bg-apex-gold-soft'     },
  { label: 'Experience Design',   icon: 'pi-map',      color: 'text-emerald-700 bg-emerald-50'       },
];

interface PlannerLoadingStateProps {
  destination: string;
}

export function PlannerLoadingState({ destination }: PlannerLoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const intervalRef             = useRef<ReturnType<typeof setInterval>>();

  /* Cycle through loading messages every 2.2 seconds */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bg-white rounded-2xl shadow-float border border-slate-100 px-8 py-10"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-5">
          {/* Outer pulse ring */}
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-apex-indigo-soft animate-ping opacity-30" />
            <div className="relative w-14 h-14 rounded-full apex-indigo-bg flex items-center justify-center shadow-float">
              <span className="font-display font-bold text-xl text-apex-gold">A</span>
            </div>
          </div>
        </div>

        <h2 className="font-display text-2xl text-apex-text-primary mb-1">
          Planning your trip…
        </h2>
        <p className="text-sm text-apex-text-tertiary">
          {destination} — three agents are working in parallel.
        </p>
      </div>

      {/* Agent status badges */}
      <div className="space-y-3 mb-8">
        {AGENTS.map((agent, i) => (
          <motion.div
            key={agent.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-apex-paper border border-slate-100"
          >
            {/* Spinning indicator */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.color}`}>
              <i
                className={`pi ${agent.icon} text-sm apex-spin`}
                style={{ display: 'inline-block' }}
                aria-hidden="true"
              />
            </div>

            <span className="text-sm font-medium text-apex-text-secondary flex-1">
              {agent.label}
            </span>

            {/* Pulsing active dot */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 apex-pulse-dot" aria-hidden="true" />
              <span className="text-xs text-apex-text-tertiary">running</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rotating status message */}
      <div
        className="text-center min-h-[24px]"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-apex-text-tertiary"
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
