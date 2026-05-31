"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useApexToast } from "@/components/ToastProvider";
import { ItineraryTimeline, type TimelineEvent } from "@/components/ItineraryTimeline";

interface PrepareSessionResponse {
  dna: Record<string, unknown>;
  signature: string;
  error?: string;
  message?: string;
  redirect?: string;
}

interface PlanResponse {
  status: string;
  user_id: string;
  itinerary: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

const DESTINATIONS = [
  { label: "Tokyo, Japan", value: "Tokyo" },
  { label: "Paris, France", value: "Paris" },
  { label: "New York, USA", value: "New York" },
  { label: "London, UK", value: "London" },
  { label: "Dubai, UAE", value: "Dubai" },
  { label: "Singapore", value: "Singapore" },
  { label: "Bangkok, Thailand", value: "Bangkok" },
  { label: "Rome, Italy", value: "Rome" },
  { label: "Barcelona, Spain", value: "Barcelona" },
  { label: "Sydney, Australia", value: "Sydney" },
  { label: "Toronto, Canada", value: "Toronto" },
  { label: "Berlin, Germany", value: "Berlin" },
  { label: "Mumbai, India", value: "Mumbai" },
  { label: "Chennai, India", value: "Chennai" },
  { label: "Los Angeles, USA", value: "Los Angeles" },
];

const INTERESTS = [
  { label: "Food", value: "food" },
  { label: "History", value: "history" },
  { label: "Nightlife", value: "nightlife" },
  { label: "Nature", value: "nature" },
  { label: "Culture", value: "culture" },
  { label: "Adventure", value: "adventure" },
  { label: "Shopping", value: "shopping" },
  { label: "Relaxation", value: "relaxation" },
];

const PACE_OPTIONS = [
  { label: "Relaxed", value: "relaxed" },
  { label: "Moderate", value: "moderate" },
  { label: "Intensive", value: "intensive" },
];

const FORM_STEPS = ["Destination", "Budget & Time", "Vibe Check"];

const LOADING_MESSAGES = [
  "The Hotel Agent is analyzing budget constraints...",
  "Flight Specialist is finding optimal routes...",
  "Coordinator is checking local weather patterns...",
  "The Attraction Agent is mapping out logistics...",
  "Running preferences through the travel matrix...",
  "The Coordinator is validating the itinerary...",
  "Hotel Agent is confirming availability...",
  "Flight Specialist is finalizing schedules...",
  "Optimizing travel budget and expenses...",
  "Compiling your itinerary details...",
];

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showError, showSuccess } = useApexToast();

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/check-onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (data.needsOnboarding) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});
  }, [status, router]);

  const [activeStep, setActiveStep] = useState(0);
  const [destination, setDestination] = useState<string>("");
  const [budget, setBudget] = useState(2500);
  
  // Using native dates instead of range picker
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("moderate");

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  const msgIndex = useRef(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      msgIndex.current = (msgIndex.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex.current]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const buildQuery = useCallback(() => {
    let days = 3;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    let query = `${days > 0 ? days : 3} days in ${destination}, $${budget} budget`;
    if (selectedInterests.length > 0) {
      query += `, interests: ${selectedInterests.join(", ")}`;
    }
    query += `, pace: ${pace}`;
    return query;
  }, [destination, budget, startDate, endDate, selectedInterests, pace]);

  const planTrip = useCallback(async () => {
    if (!destination) return;

    if (startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 21) {
        showError("Validation Error", "Trips can only be scheduled up to 21 days in advance.");
        return;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const tripLengthDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (tripLengthDays > 5) {
          showError("Duration Error", "Trip duration cannot exceed 5 days.");
          return;
        }
      }
    }

    setLoading(true);
    setEvents([]);
    msgIndex.current = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);

    try {
      const sessionRes = await fetch("/api/prepare-session");
      const sessionData: PrepareSessionResponse = await sessionRes.json();

      if (!sessionRes.ok) {
        if (sessionData.redirect) {
          window.location.href = sessionData.redirect;
          return;
        }
        throw new Error(sessionData.message ?? "Failed to load your travel profile. Are you signed in?");
      }

      const { dna, signature } = sessionData;
      const query = buildQuery();

      const planRes = await fetch(`${BACKEND_URL}/api/v2/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Apex-Signature": signature,
        },
        body: JSON.stringify({
          user_id: dna.user_id,
          query,
          dna,
          ...(startDate ? { start_date: new Date(startDate).toISOString() } : {}),
        }),
      });

      if (!planRes.ok) {
        const err = await planRes.json();
        throw new Error(err.detail ?? "The agents couldn't plan your trip. Maybe try a smaller budget?");
      }

      const planData: PlanResponse = await planRes.json();
      let parsed: TimelineEvent[];
      try {
        let raw = planData.itinerary;
        raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          raw = arrayMatch[0];
        }
        parsed = JSON.parse(raw);

        if (parsed.length > 0) {
          const summary = parsed[parsed.length - 1];
          let totalCost = 0;
          if (summary && summary.description) {
            const match = summary.description.match(/\$(\d+(?:,\d+)?)/);
            if (match) {
               totalCost = parseInt(match[1].replace(/,/g, ""), 10);
            }
          }

          if (totalCost > 0 && totalCost <= budget + 150) {
            let days = 3;
            if (startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }
            fetch("/api/trips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ destination, budget, days, itinerary: parsed })
            }).catch(console.error);
          }
        }
      } catch {
        parsed = [{
          status: "Your Itinerary",
          date: "Full Plan",
          icon: "pi pi-map",
          description: planData.itinerary,
        }];
      }
      setEvents(parsed);
      showSuccess("Trip Planned", "Your itinerary has been successfully generated!");
    } catch (err) {
      showError("Planning Failed", err instanceof Error ? err.message : "Something broke. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [destination, buildQuery, budget, startDate, endDate, showError, showSuccess]);

  const canProceed = () => {
    if (activeStep === 0) return !!destination;
    if (activeStep === 1) return budget > 0;
    return true;
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Plan Your Trip</h1>
        <p className="text-slate-500 text-lg m-0">Define your preferences and let our AI agents do the heavy lifting.</p>
      </div>

      {/* Localized Loading Banner */}
      {loading && (
        <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-5 mb-8 flex items-center gap-5 animate-fade-in-up">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
          <div>
            <h3 className="m-0 mb-1 text-lg font-bold text-slate-900">Generating Itinerary</h3>
            <p className="m-0 text-slate-500 text-sm font-medium">{loadingMsg}</p>
          </div>
        </div>
      )}

      {/* Skeleton Loading State for Content */}
      {loading && events.length === 0 && (
        <div className="flex flex-col gap-6 opacity-70">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-6 relative">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-4 h-4 rounded-full bg-slate-200 mt-1" />
                <div className="w-px h-24 bg-slate-200" />
              </div>
              <div className="flex-1 bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
                <div className="w-1/3 h-5 bg-slate-200 rounded mb-3 animate-pulse" />
                <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Step Form */}
      {events.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200 mb-10">
          
          {/* Custom Native Steps Indicator */}
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
            {FORM_STEPS.map((label, idx) => {
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;
              return (
                <div key={label} className="flex flex-col items-center gap-2 bg-white px-2">
                  <button 
                    onClick={() => idx <= activeStep && setActiveStep(idx)}
                    disabled={idx > activeStep}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                      ${isActive ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50' : 
                        isPast ? 'bg-indigo-100 text-indigo-600 cursor-pointer' : 
                        'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    {isPast ? <i className="pi pi-check text-xs" /> : (idx + 1)}
                  </button>
                  <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block
                    ${isActive || isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Step 1: Destination */}
          {activeStep === 0 && (
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Where to?</h3>
              <div className="relative">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-14 pl-4 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                >
                  <option value="" disabled>Select a destination...</option>
                  {DESTINATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <i className="pi pi-chevron-down text-slate-400" />
                </div>
              </div>
              
              {destination && (
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-flex items-center gap-3 font-semibold shadow-sm">
                  <i className="pi pi-map-marker text-indigo-600 text-xl" />
                  <span className="text-slate-800 text-lg">{destination}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Budget & Time */}
          {activeStep === 1 && (
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-8 text-slate-900">Budget & Travel Dates</h3>
              
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Total Budget</label>
                  <span className="text-3xl font-extrabold text-indigo-600">${budget}</span>
                </div>
                <input 
                  type="range" 
                  value={budget} 
                  onChange={(e) => setBudget(Number(e.target.value))} 
                  min={100} 
                  max={10000} 
                  step={50} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
                <div className="flex justify-between text-xs font-medium text-slate-400 mt-3">
                  <span>$100</span>
                  <span>$10,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Travel Dates</label>
                  <span className="text-xs font-medium text-slate-400">(optional)</span>
                </div>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="flex-1">
                    <span className="block text-xs text-slate-500 mb-1">Start Date</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs text-slate-500 mb-1">End Date</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vibe Check */}
          {activeStep === 2 && (
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-8 text-slate-900">Preferences & Pace</h3>
              
              <div className="mb-10">
                <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider block mb-4">Interests</label>
                <div className="flex flex-wrap gap-3">
                  {INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.value);
                    return (
                      <button
                        key={interest.value}
                        onClick={() => setSelectedInterests(prev => isSelected ? prev.filter(v => v !== interest.value) : [...prev, interest.value])}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'}`}
                      >
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider block mb-4">Travel Pace</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {PACE_OPTIONS.map((option) => {
                    const isSelected = pace === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setPace(option.value)}
                        className={`flex-1 px-5 py-4 rounded-xl text-center font-bold transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setActiveStep(s => Math.max(0, s - 1))} 
              disabled={activeStep === 0}
              className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors
                ${activeStep === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <i className="pi pi-arrow-left text-sm" />
              Back
            </button>
            
            {activeStep < 2 ? (
              <button 
                onClick={() => setActiveStep(s => s + 1)} 
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
                  ${!canProceed() 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
              >
                Next Step
                <i className="pi pi-arrow-right text-sm" />
              </button>
            ) : (
              <button 
                onClick={planTrip} 
                disabled={!destination}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
                  ${!destination 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
              >
                <i className="pi pi-sparkles text-sm" />
                Plan My Trip
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Timeline */}
      {events.length > 0 && !loading && (
        <div className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Your Personalized Itinerary</h2>
            <p className="text-slate-500 font-medium text-lg m-0 flex justify-center items-center gap-3">
              <span className="text-slate-800">{destination}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-indigo-600">${budget}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="capitalize text-slate-600">{pace} pace</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm mb-10">
            <ItineraryTimeline events={events} />
          </div>

          <div className="text-center mt-8">
            <button 
              onClick={() => { setEvents([]); setActiveStep(0); }} 
              className="px-8 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2 mx-auto"
            >
              <i className="pi pi-refresh text-sm" />
              Plan Another Trip
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
