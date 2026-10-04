/**
 * app/profile/page.tsx
 *
 * Server Component — fetches all profile data from MongoDB directly,
 * no client-side loading states needed.
 *
 * Data fetched:
 *   1. Survey       → homeHub, dietary, travelPace, accessibility
 *   2. FrequencyWeight → flightClass, stayTier, interests (weighted maps)
 *   3. Trip[]       → trip history (sorted newest first)
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Survey from '@/models/Survey';
import FrequencyWeight from '@/models/FrequencyWeight';
import Trip from '@/models/Trip';

import { DNACard }              from '@/components/profile/DNACard';
import { PreferenceWeightChart } from '@/components/profile/PreferenceWeightChart';
import { TripHistoryCard }       from '@/components/profile/TripHistoryCard';

export const metadata: Metadata = {
  title:       'Profile — Apex',
  description: 'Your travel DNA, preference evolution, and trip history.',
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Returns the key with the highest weight; null if all are zero or missing */
function getDominant(weights?: Record<string, number> | null): string | null {
  if (!weights) return null;
  const entries = Object.entries(weights);
  if (!entries.length) return null;
  const maxVal = Math.max(...entries.map(([, v]) => v));
  if (maxVal === 0) return null;
  return entries.find(([, v]) => v === maxVal)?.[0] ?? null;
}

/** Returns all keys with weight > 0, sorted by weight descending */
function getTopInterests(weights?: Record<string, number> | null): string[] {
  if (!weights) return [];
  return Object.entries(weights)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */

export default async function ProfilePage() {
  /* ── Auth guard ───────────────────────────────────────────────────────── */
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?unauthorized=1');
  }

  const userId = session.user.id;

  /* ── Parallel MongoDB fetch ───────────────────────────────────────────── */
  await dbConnect();

  const [surveyDoc, fwDoc, tripDocs] = await Promise.all([
    Survey.findOne({ userId }).lean(),
    FrequencyWeight.findOne({ userId }).lean(),
    Trip.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  /*
   * Serialize to plain JSON — removes ObjectId, Date, and Mongoose internals.
   * This makes the data safe to pass as props to Client Components.
   */
  const survey = surveyDoc
    ? (JSON.parse(JSON.stringify(surveyDoc)) as {
        dietary:       string;
        homeHub:       string;
        accessibility: string[];
        travelPace:    string;
      })
    : null;

  const fw = fwDoc
    ? (JSON.parse(JSON.stringify(fwDoc)) as {
        flightClass: Record<string, number>;
        stayTier:    Record<string, number>;
        interests:   Record<string, number>;
      })
    : null;

  const trips = (JSON.parse(JSON.stringify(tripDocs ?? [])) as Array<{
    _id:         string;
    destination: string;
    budget:      number;
    days:        number;
    itinerary:   unknown[];
    createdAt:   string;
  }>);

  /* ── Pre-compute dominant preferences for DNACard ───────────────────── */
  const dominantFlightClass = getDominant(fw?.flightClass);
  const dominantStayTier    = getDominant(fw?.stayTier);
  const topInterests        = getTopInterests(fw?.interests);

  /* ─────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen apex-hero-bg pt-16">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Profile header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-5 mb-8">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-card flex-shrink-0 bg-apex-indigo-soft">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={`${session.user.name ?? 'User'}'s profile photo`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="pi pi-user text-2xl text-apex-indigo" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Name + badge */}
          <div>
            <h1 className="font-display text-2xl text-apex-text-primary leading-tight">
              {session.user.name ?? 'Traveler'}
            </h1>
            <p className="text-sm text-apex-text-tertiary mt-0.5">
              {session.user.email}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-apex-gold-soft border border-apex-gold/20">
              <i className="pi pi-star-fill text-apex-gold" style={{ fontSize: '10px' }} aria-hidden="true" />
              <span className="text-xs font-semibold text-apex-gold">Travel Concierge</span>
            </div>
          </div>
        </div>

        {/* ── DNA Card ─────────────────────────────────────────────────── */}
        <DNACard
          survey={survey}
          dominantFlightClass={dominantFlightClass}
          dominantStayTier={dominantStayTier}
          topInterests={topInterests}
        />

        {/* ── Preference Weight Chart ───────────────────────────────────── */}
        {fw && (
          <PreferenceWeightChart
            interests={fw.interests   ?? {}}
            stayTier={fw.stayTier     ?? {}}
            flightClass={fw.flightClass ?? {}}
          />
        )}

        {/* ── Trip History ─────────────────────────────────────────────── */}
        <TripHistoryCard
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trips={trips as any}
        />
      </div>
    </div>
  );
}
