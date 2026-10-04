'use client';

import { motion } from 'framer-motion';
import type { TimelineEvent } from '@/lib/planTrip';

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

function isSummary(event: TimelineEvent): boolean {
  return !!event.status?.toLowerCase().includes('summary')
    || !!event.status?.toLowerCase().includes('cost');
}

export function ItineraryTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <motion.div
      className="relative py-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Vertical spine line */}
      <div
        className="absolute top-4 bottom-4 left-3.5 w-px bg-slate-200"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-8">
        {events.map((event, index) => {
          const summary = isSummary(event);

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative flex items-start gap-5"
            >
              {/* Timeline node */}
              <div
                className="relative z-10 flex-shrink-0 mt-1"
                aria-hidden="true"
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                    summary
                      ? 'bg-apex-indigo border-apex-indigo'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      summary ? 'bg-apex-gold' : 'bg-apex-indigo'
                    }`}
                  />
                </div>
              </div>

              {/* Event card */}
              <div
                className={`flex-1 rounded-2xl p-5 border transition-colors ${
                  summary
                    ? 'bg-apex-indigo-soft border-apex-indigo/20'
                    : 'bg-white border-slate-100 shadow-card hover:border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3
                    className={`font-semibold text-base leading-snug ${
                      summary ? 'text-apex-indigo' : 'text-apex-text-primary'
                    }`}
                  >
                    {event.status ?? 'Activity'}
                  </h3>

                  {event.date && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit ${
                        summary
                          ? 'bg-apex-indigo/10 text-apex-indigo'
                          : 'bg-apex-gold-soft text-apex-gold border border-apex-gold/20'
                      }`}
                    >
                      {event.date}
                    </span>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-apex-text-secondary leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
