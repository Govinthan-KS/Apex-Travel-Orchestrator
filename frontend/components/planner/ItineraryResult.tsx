'use client';

import { motion } from 'framer-motion';
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { Button } from '@/components/ui';
import type { TimelineEvent } from '@/lib/planTrip';

interface ItineraryResultProps {
  events:      TimelineEvent[];
  destination: string;
  budget:      number;
  pace:        string;
  onReset:     () => void;
}

export function ItineraryResult({
  events,
  destination,
  budget,
  pace,
  onReset,
}: ItineraryResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      {/* Summary strip */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 px-6 py-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Destination */}
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl apex-indigo-bg flex items-center justify-center flex-shrink-0">
            <i className="pi pi-map-marker text-apex-gold text-sm" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-apex-text-tertiary">Destination</p>
            <p className="font-semibold text-apex-text-primary text-sm">{destination}</p>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-slate-100" aria-hidden="true" />

        {/* Budget */}
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-apex-gold-soft flex items-center justify-center flex-shrink-0">
            <i className="pi pi-wallet text-apex-gold text-sm" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-apex-text-tertiary">Budget</p>
            <p className="font-apex-mono font-bold text-apex-indigo text-sm">
              ${budget.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-slate-100" aria-hidden="true" />

        {/* Pace */}
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <i className="pi pi-compass text-emerald-700 text-sm" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-apex-text-tertiary">Pace</p>
            <p className="font-medium text-apex-text-primary text-sm capitalize">{pace}</p>
          </div>
        </div>
      </div>

      {/* Timeline card */}
      <div className="bg-white rounded-2xl shadow-float border border-slate-100 px-5 py-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-apex-text-primary">
            Your Itinerary
          </h2>
          <span className="text-xs text-apex-text-tertiary">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        <ItineraryTimeline events={events} />
      </div>

      {/* Action */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="md"
          onClick={onReset}
          leftIcon="pi-refresh"
        >
          Plan Another Trip
        </Button>
      </div>
    </motion.div>
  );
}
