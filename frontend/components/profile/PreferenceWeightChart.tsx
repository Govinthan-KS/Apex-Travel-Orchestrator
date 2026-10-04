'use client';

import { motion } from 'framer-motion';

interface WeightMap {
  [key: string]: number;
}

interface PreferenceWeightChartProps {
  interests:   WeightMap;
  stayTier:    WeightMap;
  flightClass: WeightMap;
}

/* ── Display labels ──────────────────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  culture:         'Culture',
  adventure:       'Adventure',
  food:            'Food',
  nightlife:       'Nightlife',
  nature:          'Nature',
  shopping:        'Shopping',
  relaxation:      'Relaxation',
  budget:          'Budget',
  mid_range:       'Mid-Range',
  luxury:          'Luxury',
  resort:          'Resort',
  economy:         'Economy',
  premium_economy: 'Premium Eco',
  business:        'Business',
  first:           'First Class',
};

function fmt(key: string): string {
  return LABELS[key] ?? key;
}

/* ── Single bar row ─────────────────────────────────────────────────────── */
function BarRow({
  name,
  value,
  max,
  delay,
}: {
  name:  string;
  value: number;
  max:   number;
  delay: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 flex-shrink-0 text-xs text-apex-text-secondary truncate">
        {name}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-apex-indigo"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
          aria-hidden="true"
        />
      </div>
      <span className="w-5 text-right text-xs text-apex-text-tertiary tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ── Chart section (one category) ──────────────────────────────────────── */
function ChartSection({
  title,
  weights,
  baseDelay = 0,
}: {
  title:     string;
  weights:   WeightMap;
  baseDelay?: number;
}) {
  const entries = Object.entries(weights).sort(([, a], [, b]) => b - a);
  const max     = Math.max(...entries.map(([, v]) => v), 1);
  const hasData = entries.some(([, v]) => v > 0);

  return (
    <div>
      <p className="text-xs font-semibold text-apex-text-tertiary uppercase tracking-wider mb-3">
        {title}
      </p>

      {hasData ? (
        <div className="space-y-2.5">
          {entries.map(([key, value], i) => (
            <BarRow
              key={key}
              name={fmt(key)}
              value={value}
              max={max}
              delay={baseDelay + i * 0.04}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-apex-text-tertiary italic">
          No trips planned yet in this category.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PreferenceWeightChart — CSS bar chart showing FrequencyWeight evolution
───────────────────────────────────────────────────────────────────────── */

export function PreferenceWeightChart({
  interests,
  stayTier,
  flightClass,
}: PreferenceWeightChartProps) {
  const hasAnyData = [interests, stayTier, flightClass].some(
    (map) => Object.values(map).some((v) => v > 0)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-apex-gold-soft flex items-center justify-center">
            <i className="pi pi-chart-bar text-apex-gold text-xs" aria-hidden="true" />
          </div>
          <h2 className="font-semibold text-apex-text-primary text-sm">
            Preference Evolution
          </h2>
        </div>
        <span className="text-xs text-apex-text-tertiary">
          Based on trips planned
        </span>
      </div>

      {/* Chart body */}
      {hasAnyData ? (
        <div className="px-6 py-5 grid sm:grid-cols-3 gap-8">
          <ChartSection title="Interests"    weights={interests}   baseDelay={0}    />
          <ChartSection title="Stay Tier"    weights={stayTier}    baseDelay={0.1}  />
          <ChartSection title="Flight Class" weights={flightClass} baseDelay={0.2}  />
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <i className="pi pi-chart-bar text-2xl text-apex-text-tertiary mb-2 block" aria-hidden="true" />
          <p className="text-sm text-apex-text-tertiary">
            Your preference weights will appear here after your first planned trip.
          </p>
        </div>
      )}
    </div>
  );
}
