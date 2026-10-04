'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { Button } from '@/components/ui';
import type { TimelineEvent } from '@/lib/planTrip';
import { cn } from '@/lib/utils';

export interface SerializedTrip {
  _id:         string;
  destination: string;
  budget:      number;
  days:        number;
  itinerary:   TimelineEvent[];
  createdAt:   string;
}

interface TripHistoryCardProps {
  trips: SerializedTrip[];
}

const ITEMS_PER_PAGE = 5;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   TripHistoryCard — accordion list with pagination
───────────────────────────────────────────────────────────────────────── */

export function TripHistoryCard({ trips }: TripHistoryCardProps) {
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);

  const totalPages    = Math.ceil(trips.length / ITEMS_PER_PAGE);
  const paginated     = trips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl apex-indigo-bg flex items-center justify-center">
            <i className="pi pi-map text-apex-gold text-xs" aria-hidden="true" />
          </div>
          <h2 className="font-semibold text-apex-text-primary text-sm">Past Adventures</h2>
        </div>
        <span className="text-xs text-apex-text-tertiary">
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
        </span>
      </div>

      {/* Empty state */}
      {trips.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-12 text-center">
          <i className="pi pi-globe text-3xl text-apex-text-tertiary mb-3 block" aria-hidden="true" />
          <p className="text-sm text-apex-text-secondary">
            No adventures yet — head to the dashboard to plan your first trip.
          </p>
        </div>
      )}

      {/* Trip cards */}
      <div className="flex flex-col gap-3">
        {paginated.map((trip) => {
          const isOpen = expandedId === trip._id;

          return (
            <div
              key={trip._id}
              className={cn(
                'bg-white rounded-2xl border overflow-hidden transition-colors duration-200',
                isOpen ? 'border-apex-indigo/20 shadow-float' : 'border-slate-100 shadow-card hover:border-slate-200'
              )}
            >
              {/* Accordion trigger */}
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : trip._id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-[-2px]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Icon badge */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      isOpen ? 'apex-indigo-bg' : 'bg-apex-paper'
                    )}
                  >
                    <i
                      className={cn(
                        'pi pi-globe text-sm transition-colors',
                        isOpen ? 'text-apex-gold' : 'text-apex-text-tertiary'
                      )}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Trip info */}
                  <div className="min-w-0">
                    <p className="font-semibold text-apex-text-primary text-sm truncate">
                      {trip.destination}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-apex-text-tertiary">
                        {trip.days} {trip.days === 1 ? 'day' : 'days'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" aria-hidden="true" />
                      <span className="font-apex-mono text-xs text-apex-gold">
                        ${trip.budget.toLocaleString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" aria-hidden="true" />
                      <span className="text-xs text-apex-text-tertiary">
                        {formatDate(trip.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chevron */}
                <i
                  className={cn(
                    'pi pi-chevron-down text-xs text-apex-text-tertiary flex-shrink-0 transition-transform duration-300',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Expandable itinerary */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 px-5 py-5 bg-apex-paper/40">
                      <ItineraryTimeline events={trip.itinerary} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <i className="pi pi-angle-left text-sm" aria-hidden="true" />
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
                  page === currentPage
                    ? 'bg-apex-indigo text-white'
                    : 'text-apex-text-secondary hover:bg-apex-indigo-soft hover:text-apex-indigo'
                )}
              >
                {page}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <i className="pi pi-angle-right text-sm" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
