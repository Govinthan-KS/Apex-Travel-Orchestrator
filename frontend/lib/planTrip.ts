/**
 * lib/planTrip.ts
 *
 * Pure async function encapsulating all network logic for the trip planner.
 * No React hooks — safe to call from useCallback.
 *
 * Sequence:
 *   1. /api/prepare-session  → { dna, signature }  (HMAC auth)
 *   2. BACKEND_URL/api/v2/plan POST  → { itinerary: string }
 *   3. Parse itinerary JSON
 *   4. /api/trips POST  (fire-and-forget, save to MongoDB)
 *   5. BACKEND_URL/api/v2/sync-vibe POST  (fire-and-forget, Pinecone memory)
 */

export interface TimelineEvent {
  status?:      string;
  date?:        string;
  icon?:        string;
  color?:       string;
  image?:       string;
  description?: string;
}

interface PrepareSessionResponse {
  dna:        Record<string, unknown>;
  signature:  string;
  error?:     string;
  message?:   string;
  redirect?:  string;
}

interface PlanResponse {
  status:    string;
  user_id:   string;
  itinerary: string;
}

export interface PlanArgs {
  destination:       string;
  budget:            number;
  startDate:         string;
  endDate:           string;
  selectedInterests: string[];
  pace:              string;
  backendUrl:        string;
}

/* Builds the natural-language query the backend planner receives */
function buildQuery(args: PlanArgs): string {
  const { destination, budget, startDate, endDate, selectedInterests, pace } = args;
  let days = 3;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end   = new Date(endDate);
    days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  let query = `${days > 0 ? days : 3} days in ${destination}, $${budget} budget`;
  if (selectedInterests.length > 0) {
    query += `, interests: ${selectedInterests.join(', ')}`;
  }
  query += `, pace: ${pace}`;
  return query;
}

/**
 * executePlanTrip — throws on any unrecoverable error with a user-friendly message.
 * The component catches and displays the error; this function never calls toasts.
 *
 * Handles the prepare-session redirect case by setting window.location.href
 * (browser-safe, not React-specific).
 */
export async function executePlanTrip(args: PlanArgs): Promise<TimelineEvent[]> {
  const { destination, budget, startDate, endDate, selectedInterests, pace, backendUrl } = args;

  /* ── 1. Prepare session (DNA + HMAC signature) ─────────────────────── */
  const sessionRes  = await fetch('/api/prepare-session');
  const sessionData = (await sessionRes.json()) as PrepareSessionResponse;

  if (!sessionRes.ok) {
    if (sessionData.redirect) {
      // Hard redirect — middleware wants the user to re-auth or onboard
      window.location.href = sessionData.redirect;
      // Never resolves — navigation takes over
      return new Promise(() => {});
    }
    throw new Error(
      sessionData.message ?? 'Failed to load your travel profile. Are you signed in?'
    );
  }

  const { dna, signature } = sessionData;
  const query = buildQuery(args);

  /* ── 2. Call the planner backend ───────────────────────────────────── */
  const planRes = await fetch(`${backendUrl}/api/v2/plan`, {
    method:  'POST',
    headers: {
      'Content-Type':     'application/json',
      'X-Apex-Signature': signature,
    },
    body: JSON.stringify({
      user_id: dna.user_id,
      query,
      dna,
      ...(startDate ? { start_date: new Date(startDate).toISOString() } : {}),
    }),
  });

  if (!planRes.ok) {
    const err = await planRes.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "The agents couldn't plan your trip.");
  }

  const planData = (await planRes.json()) as PlanResponse;

  /* ── 3. Parse itinerary JSON (LLM output can be noisy) ─────────────── */
  let events: TimelineEvent[];
  try {
    let raw = planData.itinerary;
    raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (arrayMatch) raw = arrayMatch[0];
    events = JSON.parse(raw) as TimelineEvent[];
  } catch {
    // Fallback: wrap raw text as a single event so the user always sees something
    events = [{
      status:      'Your Itinerary',
      date:        'Full Plan',
      icon:        'pi pi-map',
      description: planData.itinerary,
    }];
  }

  /* ── 4. Save trip (fire-and-forget) ────────────────────────────────── */
  if (events.length > 0) {
    let days = 3;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end   = new Date(endDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    fetch('/api/trips', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ destination, budget, days, itinerary: events }),
    }).catch(console.error);
  }

  /* ── 5. Memory pipeline — sync-vibe (fire-and-forget) ──────────────── */
  const vibeText = [
    `Planned a trip to ${destination}`,
    `$${budget} total budget`,
    startDate && endDate
      ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1} days`
      : '3 days',
    `${pace} pace`,
    selectedInterests.length > 0 ? `interests: ${selectedInterests.join(', ')}` : null,
  ].filter(Boolean).join(', ');

  fetch(`${backendUrl}/api/v2/sync-vibe`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id: dna.user_id, vibe_text: vibeText }),
  }).catch((e) => console.error('sync-vibe failed (non-blocking):', e));

  return events;
}
