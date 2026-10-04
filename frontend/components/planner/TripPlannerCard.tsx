'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DESTINATIONS, INTERESTS, PACE_OPTIONS } from '@/lib/constants';
import { Tag, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/* ── Form value shape — passed back to parent on submit ─────────────────── */
export interface PlanFormValues {
  destination:       string;
  budget:            number;
  startDate:         string;
  endDate:           string;
  selectedInterests: string[];
  pace:              string;
}

interface TripPlannerCardProps {
  onSubmit:  (values: PlanFormValues) => void;
  disabled?: boolean;
}

const TODAY = new Date().toISOString().split('T')[0];

/* ── Date validation ─────────────────────────────────────────────────────── */
function validateDates(
  startDate: string,
  endDate: string
): string | null {
  if (!startDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);

  if (diffDays > 21)
    return 'Trips can only be scheduled up to 21 days in advance.';

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const tripDays =
      Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (tripDays > 5) return 'Trip duration cannot exceed 5 days.';
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   TripPlannerCard — Phase A
───────────────────────────────────────────────────────────────────────── */

export function TripPlannerCard({ onSubmit, disabled }: TripPlannerCardProps) {
  /* Form state */
  const [destination,       setDestination]       = useState('');
  const [budget,            setBudget]            = useState(2500);
  const [startDate,         setStartDate]         = useState('');
  const [endDate,           setEndDate]           = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pace,              setPace]              = useState('moderate');

  /* Dropdown state */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef    = useRef<HTMLDivElement>(null);

  /* Inline validation error */
  const [dateError, setDateError] = useState<string | null>(null);

  const toggleInterest = useCallback((value: string) => {
    setSelectedInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const handleSubmit = () => {
    if (!destination) return;

    const err = validateDates(startDate, endDate);
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);

    onSubmit({ destination, budget, startDate, endDate, selectedInterests, pace });
  };

  const selectedDestLabel =
    DESTINATIONS.find((d) => d.value === destination)?.label;

  return (
    <div className="bg-white rounded-2xl shadow-float border border-slate-100 overflow-hidden">

      {/* ── Section: Destination ─────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100">
        <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider mb-3">
          Where to?
        </p>

        <div className="relative" ref={dropdownRef}>
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label="Select destination"
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border',
              'text-sm transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
              dropdownOpen
                ? 'border-apex-indigo bg-apex-indigo-soft/30'
                : 'border-slate-200 bg-apex-paper hover:border-slate-300'
            )}
          >
            <span className={destination ? 'font-medium text-apex-text-primary' : 'text-apex-text-tertiary'}>
              {selectedDestLabel ?? 'Select a destination…'}
            </span>
            <i
              className={cn(
                'pi pi-chevron-down text-xs text-apex-text-tertiary transition-transform duration-200',
                dropdownOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Dropdown list */}
          <AnimatePresence>
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-float max-h-56 overflow-y-auto"
                  role="listbox"
                  aria-label="Destinations"
                >
                  {DESTINATIONS.map((dest) => (
                    <button
                      key={dest.value}
                      type="button"
                      role="option"
                      aria-selected={destination === dest.value}
                      onClick={() => {
                        setDestination(dest.value);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        'border-b border-slate-50 last:border-none',
                        destination === dest.value
                          ? 'bg-apex-indigo-soft text-apex-indigo font-medium'
                          : 'text-apex-text-secondary hover:bg-apex-indigo-soft/40 hover:text-apex-indigo'
                      )}
                    >
                      {dest.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Section: Budget & Dates ───────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100">
        {/* Budget slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider">
              Budget
            </p>
            <span className="font-apex-mono font-bold text-lg text-apex-indigo">
              ${budget.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={50}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="apex-slider w-full"
            style={{
              '--fill-pct': `${((budget - 100) / (10000 - 100)) * 100}%`,
            } as React.CSSProperties}
            aria-label={`Budget: $${budget}`}
            aria-valuemin={100}
            aria-valuemax={10000}
            aria-valuenow={budget}
          />
          <div className="flex justify-between text-xs text-apex-text-tertiary mt-1.5">
            <span>$100</span>
            <span>$10,000</span>
          </div>

        </div>

        {/* Travel dates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider">
              Travel Dates
            </p>
            <span className="text-xs text-apex-text-tertiary italic">
              Defaults to 3 days if end date is omitted
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'Start', value: startDate, onChange: setStartDate, min: TODAY },
              { label: 'End',   value: endDate,   onChange: setEndDate,   min: startDate || TODAY },
            ] as const).map(({ label, value, onChange, min }) => (
              <div key={label}>
                <label className="block text-xs text-apex-text-tertiary mb-1.5">
                  {label} date
                </label>
                <input
                  type="date"
                  value={value}
                  min={min}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setDateError(null);
                  }}
                  className={cn(
                    'w-full h-11 px-3 rounded-xl border text-sm bg-white',
                    'text-apex-text-primary transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-apex-indigo/10 focus:border-apex-indigo',
                    dateError ? 'border-apex-error' : 'border-slate-200'
                  )}
                  aria-invalid={!!dateError}
                />
              </div>
            ))}
          </div>

          {/* Date error */}
          {dateError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-apex-error flex items-center gap-1.5"
              role="alert"
            >
              <i className="pi pi-exclamation-circle text-xs" aria-hidden="true" />
              {dateError}
            </motion.p>
          )}
        </div>
      </div>

      {/* ── Section: Interests & Pace ─────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100">
        {/* Interests */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider mb-3">
            Interests
            {selectedInterests.length > 0 && (
              <span className="ml-2 text-apex-indigo normal-case font-normal tracking-normal">
                ({selectedInterests.length} selected)
              </span>
            )}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Interest options"
          >
            {INTERESTS.map((interest) => (
              <Tag
                key={interest.value}
                label={interest.label}
                selected={selectedInterests.includes(interest.value)}
                onClick={() => toggleInterest(interest.value)}
              />
            ))}
          </div>
        </div>

        {/* Pace */}
        <div>
          <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider mb-3">
            Travel Pace
          </p>
          <div
            className="grid grid-cols-3 gap-2"
            role="radiogroup"
            aria-label="Travel pace"
          >
            {PACE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={pace === option.value}
                onClick={() => setPace(option.value)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium border transition-colors duration-200',
                  'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
                  pace === option.value
                    ? 'bg-apex-indigo-soft border-apex-indigo text-apex-indigo'
                    : 'bg-apex-paper border-slate-200 text-apex-text-secondary hover:border-apex-indigo/30 hover:bg-apex-indigo-soft/30'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <Button
          variant="gold"
          size="lg"
          onClick={handleSubmit}
          disabled={!destination || disabled}
          className="w-full"
        >
          <i className="pi pi-bolt text-sm" aria-hidden="true" />
          Plan My Trip
        </Button>
        {!destination && (
          <p className="mt-2 text-center text-xs text-apex-text-tertiary">
            Select a destination to continue
          </p>
        )}
      </div>
    </div>
  );
}
