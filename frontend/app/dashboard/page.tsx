"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Steps } from "primereact/steps";
import { Dropdown } from "primereact/dropdown";
import { Slider } from "primereact/slider";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";

interface TimelineEvent {
  status: string;
  date: string;
  icon: string;
  color: string;
  description: string;
}

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

const FORM_STEPS = [
  { label: "Destination" },
  { label: "Budget & Time" },
  { label: "Vibe Check" },
];

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
  const { data: session, status } = useSession();
  const router = useRouter();

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
  const [destination, setDestination] = useState<string | null>(null);
  const [budget, setBudget] = useState(500);
  const [dateRange, setDateRange] = useState<Date[] | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("moderate");

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  const toast = useRef<Toast>(null);
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
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      days = Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    let query = `${days} days in ${destination}, $${budget} budget`;
    if (selectedInterests.length > 0) {
      query += `, interests: ${selectedInterests.join(", ")}`;
    }
    query += `, pace: ${pace}`;
    return query;
  }, [destination, budget, dateRange, selectedInterests, pace]);

  const planTrip = useCallback(async () => {
    if (!destination) return;

    if (dateRange && dateRange[0]) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(dateRange[0]);
      start.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 21) {
        toast.current?.show({ severity: "error", summary: "Validation Error", detail: "Trips can only be scheduled up to 21 days in advance.", life: 4000 });
        return;
      }
      if (dateRange[1]) {
        const end = new Date(dateRange[1]);
        end.setHours(0, 0, 0, 0);
        const tripLengthDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (tripLengthDays > 5) {
          toast.current?.show({ severity: "error", summary: "Duration Error", detail: "Trip duration cannot exceed 5 days.", life: 4000 });
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
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
          ...(dateRange && dateRange[0] ? { start_date: dateRange[0].toISOString() } : {}),
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
            if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
              days = Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
          color: "var(--primary-color)",
          description: planData.itinerary,
        }];
      }
      setEvents(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something broke. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [destination, buildQuery, budget, dateRange]);

  const canProceed = () => {
    if (activeStep === 0) return !!destination;
    if (activeStep === 1) return budget > 0;
    return true;
  };

  const markerTemplate = (item: TimelineEvent) => (
    <span className="flex align-items-center justify-content-center border-circle p-3 shadow-1 bg-white border-2 border-primary">
      <i className={item.icon + " text-primary text-xl"} />
    </span>
  );

  const contentTemplate = (item: TimelineEvent) => (
    <Card title={item.status} subTitle={item.date} className="mb-4 shadow-1 border-1 surface-border">
      <p className="m-0 text-color-secondary line-height-3">{item.description}</p>
    </Card>
  );

  return (
    <>
      <Toast ref={toast} />
      
      <div className="mx-auto w-full md:w-10 lg:w-8 px-4 py-6 md:py-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-semibold text-color mb-2">Plan Your Trip</h1>
          <p className="text-color-secondary text-lg m-0">Define your preferences and let our AI agents do the heavy lifting.</p>
        </div>

        {/* Localized Loading Banner */}
        {loading && (
          <div className="surface-card border-round-xl p-4 shadow-1 border-1 surface-border mb-5 flex align-items-center gap-4">
            <i className="pi pi-spinner pi-spin text-3xl text-primary"></i>
            <div>
              <h3 className="m-0 mb-1 text-xl font-medium text-color">Generating Itinerary</h3>
              <p className="m-0 text-color-secondary">{loadingMsg}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-5">
            <Message severity="error" text={error} className="w-full mb-3" />
            <Button label="Try Again" icon="pi pi-refresh" onClick={() => { setError(null); setEvents([]); }} className="block mx-auto" />
          </div>
        )}

        {/* Skeleton Loading State for Content */}
        {loading && events.length === 0 && (
          <div className="flex flex-column gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-column align-items-center gap-2">
                  <Skeleton shape="circle" size="3rem" />
                  <Skeleton width="2px" height="8rem" />
                </div>
                <div className="flex-grow-1">
                  <Skeleton width="40%" height="2rem" className="mb-3" />
                  <Skeleton width="100%" height="6rem" className="border-round-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form State */}
        {events.length === 0 && !loading && !error && (
          <div className="surface-card border-round-2xl p-4 md:p-6 shadow-2 border-1 surface-border mb-6">
            <Steps model={FORM_STEPS} activeIndex={activeStep} onSelect={(e) => setActiveStep(e.index)} readOnly={false} className="mb-6" />

            {/* Step 1: Destination */}
            {activeStep === 0 && (
              <div className="fadein animation-duration-300">
                <h3 className="text-2xl font-semibold mb-4 text-color">Where to?</h3>
                <Dropdown id="destination-select" value={destination} options={DESTINATIONS} onChange={(e) => setDestination(e.value)} placeholder="Search for a city..." filter filterPlaceholder="Type to search" className="w-full p-inputtext-lg" />
                {destination && (
                  <div className="mt-4 p-3 border-round-lg surface-100 border-1 surface-border inline-flex align-items-center gap-2 font-medium">
                    <i className="pi pi-map-marker text-primary" />
                    <span className="text-color">{destination}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Budget & Time */}
            {activeStep === 1 && (
              <div className="fadein animation-duration-300">
                <h3 className="text-2xl font-semibold mb-5 text-color">Budget & Travel Dates</h3>
                
                <div className="mb-6">
                  <div className="flex justify-content-between align-items-center mb-3">
                    <label className="font-medium text-color">Budget</label>
                    <span className="text-xl font-bold text-primary">${budget}</span>
                  </div>
                  <Slider value={budget} onChange={(e) => setBudget(e.value as number)} min={100} max={10000} step={50} className="w-full" />
                  <div className="flex justify-content-between text-sm text-color-secondary mt-2">
                    <span>$100</span>
                    <span>$10,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-content-between align-items-center mb-3">
                    <label className="font-medium text-color">Travel Dates</label>
                    <span className="text-sm text-color-secondary">(optional)</span>
                  </div>
                  <Calendar id="date-range" value={dateRange} onChange={(e) => setDateRange(e.value as Date[] | null)} selectionMode="range" readOnlyInput placeholder="Select date range" className="w-full p-inputtext-lg" minDate={new Date()} maxDate={new Date(new Date().setDate(new Date().getDate() + 21))} dateFormat="dd M yy" />
                </div>
              </div>
            )}

            {/* Step 3: Vibe Check */}
            {activeStep === 2 && (
              <div className="fadein animation-duration-300">
                <h3 className="text-2xl font-semibold mb-5 text-color">Preferences & Pace</h3>
                
                <div className="mb-6">
                  <label className="font-medium text-color block mb-3">Interests</label>
                  <div className="flex flex-wrap gap-3">
                    {INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.value);
                      return (
                        <button
                          key={interest.value}
                          onClick={() => setSelectedInterests(prev => isSelected ? prev.filter(v => v !== interest.value) : [...prev, interest.value])}
                          className={`cursor-pointer px-4 py-2 border-round-lg font-medium transition-colors transition-duration-200 border-1 ${isSelected ? 'bg-primary border-primary text-white' : 'surface-card surface-border text-color-secondary hover:surface-hover'}`}
                        >
                          {interest.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-medium text-color block mb-3">Travel Pace</label>
                  <div className="flex gap-3">
                    {PACE_OPTIONS.map((option) => {
                      const isSelected = pace === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setPace(option.value)}
                          className={`flex-1 cursor-pointer px-4 py-3 border-round-lg font-medium transition-colors transition-duration-200 border-1 ${isSelected ? 'bg-primary border-primary text-white' : 'surface-card surface-border text-color-secondary hover:surface-hover'}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
              <Button label="Back" icon="pi pi-arrow-left" className="p-button-text" onClick={() => setActiveStep(s => Math.max(0, s - 1))} disabled={activeStep === 0} />
              {activeStep < 2 ? (
                <Button label="Next" icon="pi pi-arrow-right" iconPos="right" onClick={() => setActiveStep(s => s + 1)} disabled={!canProceed()} />
              ) : (
                <Button label="Plan My Trip" icon="pi pi-send" onClick={planTrip} disabled={!destination} className="p-button-primary px-5" />
              )}
            </div>
          </div>
        )}

        {/* Results Timeline */}
        {events.length > 0 && !loading && (
          <div className="fadein animation-duration-500">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-color mb-2">Your Personalized Itinerary</h2>
              <p className="text-color-secondary text-lg m-0">{destination} — ${budget} budget — {pace} pace</p>
            </div>

            <Timeline value={events} align="alternate" marker={markerTemplate} content={contentTemplate} className="mb-6" />

            <div className="text-center mt-6">
              <Button label="Plan Another Trip" icon="pi pi-refresh" onClick={() => { setEvents([]); setActiveStep(0); }} className="p-button-outlined px-5 py-3" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
