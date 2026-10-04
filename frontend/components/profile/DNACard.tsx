'use client';

import Link from 'next/link';
import { Tag } from '@/components/ui';
import { getCityDisplay } from '@/lib/constants';


interface DNACardProps {
  survey: {
    dietary:       string;
    homeHub:       string;
    accessibility: string[];
    travelPace:    string;
  } | null;
  dominantFlightClass: string | null;
  dominantStayTier:    string | null;
  topInterests:        string[];
}

/* ── Display label lookup ──────────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  none:            'No restrictions',
  vegetarian:      'Vegetarian',
  vegan:           'Vegan',
  halal:           'Halal',
  kosher:          'Kosher',
  'gluten-free':   'Gluten-Free',
  relaxed:         'Relaxed',
  moderate:        'Moderate',
  intensive:       'Intensive',
  economy:         'Economy',
  premium_economy: 'Premium Economy',
  business:        'Business',
  first:           'First Class',
  budget:          'Budget',
  mid_range:       'Mid-Range',
  luxury:          'Luxury',
  resort:          'Resort',
  wheelchair:      'Wheelchair',
  visual_aid:      'Visual Aid',
  hearing_aid:     'Hearing Aid',
  mobility_support:'Mobility Support',
  culture:         'Culture',
  adventure:       'Adventure',
  food:            'Food',
  nightlife:       'Nightlife',
  nature:          'Nature',
  shopping:        'Shopping',
  relaxation:      'Relaxation',
};

function label(key: string | null | undefined): string {
  if (!key) return '—';
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/* ── DNA field row ──────────────────────────────────────────────────────── */
function DNAField({
  icon,
  fieldLabel,
  value,
}: {
  icon:        string;
  fieldLabel:  string;
  value:       string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-none">
      <div className="w-7 h-7 rounded-lg bg-apex-indigo-soft flex items-center justify-center flex-shrink-0">
        <i className={`pi ${icon} text-apex-indigo text-xs`} aria-hidden="true" />
      </div>
      <span className="text-xs text-apex-text-tertiary w-32 flex-shrink-0 uppercase tracking-wider font-medium">
        {fieldLabel}
      </span>
      <span className="text-sm font-medium text-apex-text-primary">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DNACard — server-safe display component
───────────────────────────────────────────────────────────────────────── */

export function DNACard({
  survey,
  dominantFlightClass,
  dominantStayTier,
  topInterests,
}: DNACardProps) {
  if (!survey) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 mb-6 text-center">
        <i className="pi pi-id-card text-2xl text-apex-text-tertiary mb-3 block" aria-hidden="true" />
        <p className="text-sm text-apex-text-secondary mb-4">
          Your travel profile has not been set up yet.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-apex-indigo hover:text-apex-indigo-mid transition-colors"
        >
          Set up your DNA
          <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const accessibilityLabel =
    survey.accessibility.length > 0
      ? survey.accessibility.map((a) => label(a)).join(', ')
      : 'None';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card mb-6 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl apex-indigo-bg flex items-center justify-center">
            <i className="pi pi-id-card text-apex-gold text-xs" aria-hidden="true" />
          </div>
          <h2 className="font-semibold text-apex-text-primary text-sm">Your Travel DNA</h2>
        </div>
        <Link
          href="/onboarding"
          className="text-xs text-apex-text-tertiary hover:text-apex-indigo transition-colors flex items-center gap-1"
          aria-label="Edit travel DNA"
        >
          Edit <i className="pi pi-pencil text-[10px]" aria-hidden="true" />
        </Link>
      </div>

      {/* Fields */}
      <div className="px-6">
        <DNAField icon="pi-map-marker"   fieldLabel="Home Hub"      value={getCityDisplay(survey.homeHub)} />
        <DNAField icon="pi-heart"        fieldLabel="Dietary"       value={label(survey.dietary)} />
        <DNAField icon="pi-bolt"         fieldLabel="Travel Pace"   value={label(survey.travelPace)} />
        <DNAField icon="pi-shield"       fieldLabel="Accessibility" value={accessibilityLabel} />
        <DNAField icon="pi-send"         fieldLabel="Flight Class"  value={label(dominantFlightClass)} />
        <DNAField icon="pi-building"     fieldLabel="Stay Tier"     value={label(dominantStayTier)} />
      </div>

      {/* Interests */}
      {topInterests.length > 0 && (
        <div className="px-6 pb-5 pt-3 border-t border-slate-100 mt-1">
          <p className="text-xs text-apex-text-tertiary uppercase tracking-wider font-medium mb-3">
            Interests
          </p>
          <div className="flex flex-wrap gap-2">
            {topInterests.map((interest) => (
              <Tag
                key={interest}
                label={label(interest)}
                selected
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
