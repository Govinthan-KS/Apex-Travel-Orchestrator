/**
 * app/dashboard/loading.tsx
 *
 * Next.js streaming skeleton shown while the dashboard page suspends.
 * Uses our own Skeleton shimmer component — no PrimeReact dependency.
 */

export default function DashboardLoading() {
  return (
    <div className="min-h-screen apex-hero-bg pt-16">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Greeting skeleton ────────────────────────────────────────── */}
        <div className="mb-7 space-y-2">
          <div className="h-3 w-24 rounded-full apex-shimmer" />
          <div className="h-8 w-48 rounded-xl apex-shimmer" />
          <div className="h-4 w-64 rounded-full apex-shimmer" />
        </div>

        {/* ── TripPlannerCard skeleton ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-float overflow-hidden">

          {/* Destination section */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-3">
            <div className="h-3 w-20 rounded-full apex-shimmer" />
            <div className="h-12 w-full rounded-xl apex-shimmer" />
          </div>

          {/* Budget & Dates section */}
          <div className="px-6 py-5 border-b border-slate-100 space-y-6">
            {/* Budget */}
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded-full apex-shimmer" />
                <div className="h-5 w-20 rounded-full apex-shimmer" />
              </div>
              <div className="h-2 w-full rounded-full apex-shimmer" />
            </div>
            {/* Dates */}
            <div className="space-y-2.5">
              <div className="h-3 w-24 rounded-full apex-shimmer" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-11 rounded-xl apex-shimmer" />
                <div className="h-11 rounded-xl apex-shimmer" />
              </div>
            </div>
          </div>

          {/* Interests & Pace section */}
          <div className="px-6 py-5 border-b border-slate-100 space-y-6">
            {/* Interests chips */}
            <div className="space-y-3">
              <div className="h-3 w-20 rounded-full apex-shimmer" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-xl apex-shimmer"
                    style={{ width: `${64 + (i % 3) * 16}px` }}
                  />
                ))}
              </div>
            </div>
            {/* Pace */}
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-full apex-shimmer" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-xl apex-shimmer" />
                ))}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="px-6 py-5">
            <div className="h-13 w-full rounded-xl apex-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
