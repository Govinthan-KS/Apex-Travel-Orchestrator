"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ItineraryTimeline, type TimelineEvent } from "@/components/ItineraryTimeline";

interface LogisticsDna {
  user_id: string;
  constraints: {
    dietary: string[];
    home_hub: string;
    accessibility: string[];
    travel_pace: string;
  };
  weights: {
    flight_class: Record<string, number>;
    stay_tier: Record<string, number>;
    interests: string[];
  };
}

const DNA_LABELS: Record<string, { icon: string; label: string }> = {
  home_hub: { icon: "pi-home", label: "Home Hub" },
  dietary: { icon: "pi-heart", label: "Dietary" },
  travel_pace: { icon: "pi-bolt", label: "Travel Pace" },
  accessibility: { icon: "pi-shield", label: "Accessibility" },
};

const IATA_TO_CITY: Record<string, string> = {
  "MAA": "Chennai", "NRT": "Tokyo", "BLR": "Bangalore",
  "LHR": "London", "JFK": "New York", "DEL": "Delhi",
  "IXC": "Chandigarh", "BOM": "Mumbai", "DXB": "Dubai",
  "SIN": "Singapore", "CDG": "Paris", "BKK": "Bangkok",
  "SYD": "Sydney", "FCO": "Rome", "BER": "Berlin",
  "YYZ": "Toronto", "BCN": "Barcelona", "LAX": "Los Angeles",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dna, setDna] = useState<LogisticsDna | null>(null);
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [loadingDna, setLoadingDna] = useState(true);

  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  
  // Track which trip is expanded in the accordion
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const fetchDna = useCallback(async () => {
    setLoadingDna(true);
    try {
      const res = await fetch("/api/prepare-session");
      if (!res.ok) {
        const data = await res.json();
        if (data.redirect) {
          setDnaError("Complete your onboarding survey to see your profile.");
          return;
        }
        throw new Error(data.message ?? "Failed to load profile");
      }
      const data = await res.json();
      setDna(data.dna);
    } catch (err) {
      setDnaError(err instanceof Error ? err.message : "Could not load your travel DNA.");
    } finally {
      setLoadingDna(false);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
       fetchDna();
       fetchTrips();
    }
    if (status === "unauthenticated") router.push("/login");
  }, [status, fetchDna, fetchTrips, router]);

  const getTopPref = (weights: Record<string, number>): string => {
    const entries = Object.entries(weights);
    if (entries.length === 0) return "Not set";
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (status === "loading" || loadingDna) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 md:py-12">
      {/* ── User Card ── */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm mb-10 flex items-center gap-6 md:gap-8 flex-wrap">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner border border-slate-200">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <i className="pi pi-user text-3xl text-slate-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 m-0 mb-1 leading-tight">
            {session?.user?.name ?? "Traveler"}
          </h1>
          <p className="text-slate-500 m-0 mb-3 text-base">
            {session?.user?.email ?? ""}
          </p>
          {dna && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Verified Explorer
            </span>
          )}
        </div>
      </div>

      {/* ── Logistics DNA ── */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <i className="pi pi-id-card text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">Your Logistics DNA</h2>
        </div>

        {dnaError && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6">
            <p className="text-amber-800 m-0 text-sm font-medium">{dnaError}</p>
          </div>
        )}

        {dna && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hard Constraints */}
            {Object.entries(DNA_LABELS).map(([key, meta]) => {
              const val = dna.constraints[key as keyof typeof dna.constraints];
              let display = Array.isArray(val) ? (val.length > 0 ? val.join(", ") : "None") : String(val);
              if (key === "home_hub") {
                display = IATA_TO_CITY[String(val).toUpperCase()] || String(val);
              }
              return (
                <div key={key} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <i className={`pi ${meta.icon} text-slate-400`} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{meta.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 m-0 capitalize truncate" title={display}>
                    {display}
                  </p>
                </div>
              );
            })}

            {/* Soft Preferences */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <i className="pi pi-send text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Flight Class</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 m-0 capitalize">
                {getTopPref(dna.weights.flight_class)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <i className="pi pi-building text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stay Tier</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 m-0 capitalize">
                {getTopPref(dna.weights.stay_tier)}
              </p>
            </div>

            {/* Interests - Spans 2 columns on lg */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <i className="pi pi-heart text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interests</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {dna.weights.interests.length > 0 ? (
                  dna.weights.interests.map((interest) => (
                    <span key={interest} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium capitalize">
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">No interests selected</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Past Adventures (Accordion View) ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <i className="pi pi-map text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 m-0">Past Adventures</h2>
        </div>

        <div className="flex flex-col gap-3">
          {loadingTrips ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            </div>
          ) : trips.length > 0 ? (
            trips.map((trip: any) => {
              const isExpanded = expandedTripId === trip._id;
              
              return (
                <div 
                  key={trip._id} 
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
                >
                  {/* Accordion Header */}
                  <button 
                    onClick={() => setExpandedTripId(isExpanded ? null : trip._id)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white focus:outline-none transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        <i className="pi pi-globe text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 m-0 mb-1 capitalize">
                          {trip.destination}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium m-0 flex items-center gap-2">
                          <span>{trip.days} days</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-slate-700">${trip.budget} budget</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-100' : 'bg-transparent text-slate-400'}`}>
                      <i className="pi pi-chevron-down" />
                    </div>
                  </button>
                  
                  {/* Accordion Content */}
                  <div 
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-2 sm:p-4 bg-slate-50 border-t border-slate-100">
                        <ItineraryTimeline events={trip.itinerary || []} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center">
              <i className="pi pi-compass text-4xl text-slate-300 mb-4 block" />
              <h3 className="text-lg font-semibold text-slate-700 m-0 mb-2">No trips planned yet</h3>
              <p className="text-slate-500 text-sm m-0 max-w-md mx-auto">
                Your trip history will appear here once you've successfully planned an itinerary within your budget.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
