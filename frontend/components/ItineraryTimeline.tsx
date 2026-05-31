"use client";

export interface TimelineEvent {
  status?: string;
  date?: string;
  icon?: string;
  color?: string;
  image?: string;
  description?: string;
}

export function ItineraryTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative py-4 px-2 sm:px-4">
      {/* ── The Absolute Tracking Line ── 
          Runs strictly down the left side, stopping just before the last item. */}
      <div 
        className="absolute top-6 bottom-6 left-6 sm:left-8 w-px bg-slate-800" 
      />

      <div className="flex flex-col gap-10">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const isSummary = event.status?.toLowerCase().includes("summary");

          return (
            <div key={index} className="relative flex items-start group">
              
              {/* ── Node Indicator ── */}
              <div 
                className="absolute left-1 sm:left-3 mt-1.5 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 border-[3px] border-slate-900 transition-colors group-hover:border-lime-500/50"
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full ${
                    isSummary 
                      ? "bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]" 
                      : "bg-slate-700 group-hover:bg-lime-400 group-hover:shadow-[0_0_10px_rgba(163,230,53,0.5)] transition-all"
                  }`} 
                />
              </div>

              {/* ── Content Container ── 
                  Pushed to the right of the absolute node/line */}
              <div className="ml-16 sm:ml-20 flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-lime-500/20 hover:shadow-[0_0_15px_rgba(163,230,53,0.05)] transition-all">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-xl font-bold text-slate-200 m-0 tracking-tight">
                    {event.status || "Activity"}
                  </h3>
                  
                  {event.date && (
                    <span className="text-sm font-semibold text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 inline-block w-fit">
                      {event.date}
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-slate-400 text-base leading-relaxed m-0">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
