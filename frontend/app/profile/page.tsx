"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useApexToast } from "@/components/ToastProvider";
import { ItineraryTimeline, type TimelineEvent } from "@/components/ItineraryTimeline";

interface DBTrip {
  _id: string;
  destination: string;
  budget: number;
  days: number;
  itinerary: TimelineEvent[];
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showError } = useApexToast();
  
  const [trips, setTrips] = useState<DBTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      fetch("/api/trips")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch trips");
          return res.json();
        })
        .then((data) => {
          setTrips(data);
          setLoading(false);
        })
        .catch(() => {
          showError("Fetch Failed", "Could not load past adventures.");
          setLoading(false);
        });
    }
  }, [status, router, showError]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-73px)] bg-slate-950">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-lime-400 rounded-full animate-spin shadow-[0_0_15px_rgba(163,230,53,0.3)]"></div>
      </div>
    );
  }

  const dna = {
    home_hub: "Chennai",
    dietary: "Vegetarian",
    travel_pace: "Moderate",
    accessibility: "None",
    flight_class: "Premium Economy",
    stay_tier: "Mid Range",
    interests: ["Culture", "Food", "Nightlife"],
  };

  // Pagination Logic
  const totalPages = Math.ceil(trips.length / itemsPerPage);
  const paginatedTrips = trips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 min-h-[calc(100vh-73px)]">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-[0_0_20px_rgba(163,230,53,0.15)] flex-shrink-0 z-10 bg-slate-800">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <i className="pi pi-user text-5xl" />
            </div>
          )}
        </div>
        <div className="text-center md:text-left z-10">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent tracking-tight">
            {session?.user?.name || "Traveler"}
          </h1>
          <p className="text-slate-400 text-lg mb-4 font-medium">{session?.user?.email}</p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 text-sm font-bold tracking-wide">
            <i className="pi pi-star-fill text-xs" />
            Elite Orchestrator
          </div>
        </div>
      </div>

      {/* ── Logistics DNA ── */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <i className="pi pi-id-card text-lg" />
          </div>
          <h2 className="text-2xl font-bold text-slate-200 m-0">Your Logistics DNA</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-home" /> Home Hub</div>
            <div className="text-lg font-bold text-slate-200">{dna.home_hub}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-heart" /> Dietary</div>
            <div className="text-lg font-bold text-slate-200">{dna.dietary}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-bolt" /> Travel Pace</div>
            <div className="text-lg font-bold text-slate-200">{dna.travel_pace}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-shield" /> Accessibility</div>
            <div className="text-lg font-bold text-slate-200">{dna.accessibility}</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-2">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-send" /> Flight & Stay</div>
            <div className="flex gap-4 items-end mt-1">
              <div>
                <span className="block text-slate-500 text-xs mb-1">Class</span>
                <span className="font-bold text-slate-200">{dna.flight_class}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="block text-slate-500 text-xs mb-1">Tier</span>
                <span className="font-bold text-slate-200">{dna.stay_tier}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-2">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wider"><i className="pi pi-compass" /> Interests</div>
            <div className="flex flex-wrap gap-2">
              {dna.interests.map(i => (
                <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-700">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Past Adventures (Paginated Accordion) ── */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-400 flex items-center justify-center border border-lime-500/20 shadow-[0_0_15px_rgba(163,230,53,0.1)]">
              <i className="pi pi-map text-lg" />
            </div>
            <h2 className="text-2xl font-bold text-slate-200 m-0">Past Adventures</h2>
          </div>
          <span className="text-sm font-medium text-slate-500">{trips.length} Total Trips</span>
        </div>

        {trips.length === 0 ? (
          <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl">
            <i className="pi pi-globe text-4xl text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium text-lg">No adventures yet. Time to plan one!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {paginatedTrips.map((trip) => {
              const isExpanded = expandedTripId === trip._id;
              
              return (
                <div 
                  key={trip._id} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300
                    ${isExpanded ? 'bg-slate-900 border-lime-500/30 shadow-[0_0_20px_rgba(163,230,53,0.05)]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <button 
                    onClick={() => setExpandedTripId(isExpanded ? null : trip._id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                        ${isExpanded ? 'bg-lime-500/10 text-lime-400' : 'bg-slate-800 text-slate-400'}`}>
                        <i className="pi pi-globe text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-200 m-0 mb-1">{trip.destination}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                          <span>{trip.days} days</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>${trip.budget} budget</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300
                      ${isExpanded ? 'rotate-180 bg-slate-800 text-slate-200' : 'text-slate-500'}`}>
                      <i className="pi pi-chevron-down text-sm" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <div 
                    className={`transition-all duration-500 ease-in-out origin-top overflow-hidden
                      ${isExpanded ? 'max-h-[5000px] opacity-100 border-t border-slate-800/50' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="p-2 sm:p-6 bg-slate-950/50">
                      <ItineraryTimeline events={trip.itinerary} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
                >
                  <i className="pi pi-angle-left" />
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-lime-400 text-slate-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
                >
                  <i className="pi pi-angle-right" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
