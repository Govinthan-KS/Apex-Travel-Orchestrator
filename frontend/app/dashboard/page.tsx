/*
 * Dashboard — dashboard/page.tsx
 * The command center. The cockpit. The BIG & BOLD cockpit.
 * We cranked everything up to 1.5x because subtlety is overrated.
 *
 * Features:
 *   - Multi-step trip form (PrimeReact Steps) — inflated like it's 2008
 *   - HMAC-signed payload to FastAPI backend
 *   - "Goofy" loading overlay with rotating snarky messages
 *   - PrimeReact Timeline with Lime Green cards + Sky Blue icons
 *
 * This check is tighter than my jeans after a weekend in Vegas.
 * (referring to the HMAC verification, obviously)
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Steps } from "primereact/steps";
import { Dropdown } from "primereact/dropdown";
import { Slider } from "primereact/slider";
import { Calendar } from "primereact/calendar";
import { SelectButton } from "primereact/selectbutton";
import { Button } from "primereact/button";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

/* TypeScript Interfaces                                        */
/* These MUST match the Python Pydantic models perfectly.       */
/* If they don't, the backend will be very disappointed.        */

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

/* Constants — the dropdown options, snarky messages, etc.      */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

/* Major cities for the destination dropdown */
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

/* Interests for the multi-select */
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

/* Travel pace options */
const PACE_OPTIONS = [
  { label: "Relaxed", value: "relaxed" },
  { label: "Moderate", value: "moderate" },
  { label: "Intensive", value: "intensive" },
];

/* Multi-step form step labels */
const FORM_STEPS = [
  { label: "Destination" },
  { label: "Budget & Time" },
  { label: "Vibe Check" },
];

/*
 * The snarky loading messages.
 * The Hotel Agent approved all of these. The Flight agent did not.
 */
const LOADING_MESSAGES = [
  "The Hotel Agent is currently judging your budget choices...",
  "Bribing the Flight Specialist with digital cookies...",
  "Coordinator is checking if the destination has good Wi-Fi...",
  "The Attraction Agent is arguing with Google Maps...",
  "Running your vibes through the Pinecone matrix...",
  "The Coordinator just said 'I need to think about this'...",
  "The Hotel Agent found a hotel but doesn't like the curtains...",
  "Flight Specialist is pretending to understand IATA codes...",
  "Crunching numbers... and by numbers I mean your budget...",
  "Almost done! The agents are writing your itinerary in JSON...",
];

/*
 * Selection state colors
 * Selected: Sky Blue bg, white text, lime border
 * Idle:     Very light lime bg, gray text
 *
 * Inflating these buttons like it's 2008 and we're in a housing bubble.
 */
const SELECTED_STYLE = {
  background: "#7ec8e3",
  color: "#ffffff",
  border: "2px solid #a3d980",
  transform: "scale(1.03)",
  boxShadow: "0 4px 16px rgba(126, 200, 227, 0.4)",
};

const IDLE_STYLE = {
  background: "#f0f9e8",
  color: "#5a6b5a",
  border: "2px solid transparent",
};


/* Component                                                    */


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  /*
   * New-user check: calls /api/check-onboarding which uses Mongoose
   * to directly query the surveys collection. No JWT flag casting,
   * no ObjectId vs string drama. Just one fetch, one DB query.
   *
   * Only runs when the session is authenticated (not during loading).
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/check-onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (data.needsOnboarding) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {
        /* If the check fails, let them use the dashboard anyway */
      });
  }, [status, router]);

  /* ── Multi-step form state ── */
  const [activeStep, setActiveStep] = useState(0);
  const [destination, setDestination] = useState<string | null>(null);
  const [budget, setBudget] = useState(500);
  const [dateRange, setDateRange] = useState<Date[] | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("moderate");

  /* ── Results state ── */
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  /* ── Toast ref for date validation ── */
  const toast = useRef<Toast>(null);

  /* ── Loading message cycler — rotates every 1.5s ── */
  const msgIndex = useRef(0);
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      msgIndex.current = (msgIndex.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex.current]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  /* ── Build the query string from form data ── */
  const buildQuery = useCallback(() => {
    /*
     * Adding this so the app doesn't have a mid-life crisis
     * if the user ignores the calendar. We default to 3 days.
     */
    let days = 3;
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      days = Math.ceil(
        (dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    }

    let query = `${days} days in ${destination}, $${budget} budget`;
    if (selectedInterests.length > 0) {
      query += `, interests: ${selectedInterests.join(", ")}`;
    }
    query += `, pace: ${pace}`;
    return query;
  }, [destination, budget, dateRange, selectedInterests, pace]);

  /*
   * The Big Green Button Handler
   * Two-step fetch:
   *   1. GET /api/prepare-session → DNA + HMAC Signature
   *   2. POST /api/v2/plan → signed payload to Python backend
   *
   * This check is tighter than my jeans after a weekend in Vegas.
   */
  const planTrip = useCallback(async () => {
    if (!destination) return;

    // Date Constraint Validation: Max 21 Days
    if (dateRange && dateRange[0]) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const start = new Date(dateRange[0]);
      start.setHours(0, 0, 0, 0);

      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 21) {
        toast.current?.show({ 
          severity: "error", 
          summary: "Validation Error", 
          detail: "Trips can only be scheduled up to 21 days in advance.", 
          life: 4000 
        });
        return;
      }

      // Check max duration of 5 days for Vercel timeout constraints
      if (dateRange[1]) {
        const end = new Date(dateRange[1]);
        end.setHours(0, 0, 0, 0);
        const tripLengthDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (tripLengthDays > 5) {
          toast.current?.show({ 
            severity: "error", 
            summary: "Duration Error", 
            detail: "Trip duration cannot exceed 5 days.", 
            life: 4000 
          });
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
      /* Step 1: Fetch DNA + Signature from Next.js (authenticated) */
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

      /* Step 2: Send signed payload to Python backend */
      const planRes = await fetch(`${BACKEND_URL}/api/v2/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          /* This header is verified by auth_utils.py on the backend.
             If it doesn't match, you get a 403 faster than you can say "Groq credits". */
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

      /* Step 3: Parse the JSON itinerary from the coordinator */
      let parsed: TimelineEvent[];
      try {
        /*
         * This regex is a cursed artifact from the 90s; do not touch it
         * or the app will haunt you. It strips markdown code fences.
         */
        let raw = planData.itinerary;
        raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        /* Sometimes the LLM wraps the JSON in extra text — find the array */
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          raw = arrayMatch[0];
        }

        parsed = JSON.parse(raw);

        /* Step 4: Validate budget and save to Trip History */
        if (parsed.length > 0) {
          const summary = parsed[parsed.length - 1];
          let totalCost = 0;
          if (summary && summary.description) {
            // Extract the "$xxx" value from the summary description
            const match = summary.description.match(/\$(\d+(?:,\d+)?)/);
            if (match) {
               totalCost = parseInt(match[1].replace(/,/g, ""), 10);
            }
          }

          // If the AI kept it within budget (or max $150 over), save it to history forever!
          if (totalCost > 0 && totalCost <= budget + 150) {
            let days = 3;
            if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
              days = Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }
            fetch("/api/trips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                destination,
                budget,
                days,
                itinerary: parsed
              })
            }).catch(console.error); // Silent fail if DB gives up
          }
        }

      } catch {
        /* Fallback: if the LLM went rogue and returned plain text,
           wrap it in a single timeline card so the UI doesn't break */
        parsed = [
          {
            status: "Your Itinerary",
            date: "Full Plan",
            icon: "pi pi-map",
            color: "#7ec8e3",
            description: planData.itinerary,
          },
        ];
      }

      setEvents(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something broke. Blame the Hotel Agent.");
    } finally {
      setLoading(false);
    }
  }, [destination, buildQuery]);

  /* Can we proceed to the next step? */
  const canProceed = () => {
    if (activeStep === 0) return !!destination;
    if (activeStep === 1) return budget > 0;
    return true;
  };

  /* ── Timeline marker renderer — chunky Sky Blue circles ── */
  const markerTemplate = (item: TimelineEvent) => (
    <span
      className="flex align-items-center justify-content-center border-circle"
      style={{
        /* Inflating these buttons like it's 2008 and we're in a housing bubble */
        backgroundColor: "#7ec8e3",
        width: "3.5rem",
        height: "3.5rem",
        color: "#ffffff",
        boxShadow: `0 0 18px ${item.color || "#7ec8e3"}45`,
      }}
    >
      <i className={item.icon} style={{ fontSize: "1.4rem" }} />
    </span>
  );

  /* ── Timeline content renderer — Lime Green background cards, CHONKY ── */
  const contentTemplate = (item: TimelineEvent) => (
    <Card
      title={item.status}
      subTitle={item.date}
      style={{
        marginBottom: "1.5rem",
        /* This lime green is so bright it might actually fix my seasonal depression */
        background: item.icon.includes("wallet") ? "#e8f1ff" : "#d1f0b140",
        borderLeft: `5px solid ${item.color || "#7ec8e3"}`,
        borderRadius: "16px",
        padding: "0.5rem",
      }}
    >
      <p style={{ lineHeight: 1.8, color: "#3a4a3a", margin: 0, fontSize: "1.05rem" }}>
        {item.description}
      </p>
    </Card>
  );

  /* Render — everything is 1.5x bigger here, deal with it      */
  return (
    <>
      <Toast ref={toast} />

      {/* ── LOADING OVERLAY — the goofy full-screen monster ── */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(248, 253, 244, 0.96)",
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2.5rem",
          }}
        >
          {/* Spinning lime green ring — bigger & bolder */}
          <div
            style={{
              width: "80px",
              height: "80px",
              border: "6px solid #e8f8d8",
              borderTop: "6px solid #a3d980",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#2a5a2a",
              textAlign: "center",
              maxWidth: "500px",
              animation: "pulse 1.5s ease-in-out infinite",
              lineHeight: 1.6,
            }}
          >
            {loadingMsg}
          </p>
          <p style={{ fontSize: "0.9rem", color: "#8a9b8a" }}>
            This usually takes a few minutes. Grab a cup of coffee.
          </p>
        </div>
      )}

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* ── Page Header — B I G ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: 900,
              color: "#1a2e1a",
              marginBottom: "0.5rem",
              letterSpacing: "-0.5px",
            }}
          >
            Plan Your Trip
          </h1>
          <p style={{ color: "#5a6b5a", fontSize: "1.2rem" }}>
            Fill in the details and let four AI agents do the heavy lifting.
          </p>
        </div>

        {/* ── Multi-Step Form — CHUNKY EDITION ── */}
        {events.length === 0 && !loading && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "3rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: "2px solid #e8f8d8",
              marginBottom: "2.5rem",
            }}
          >
            {/* Steps indicator */}
            <Steps
              model={FORM_STEPS}
              activeIndex={activeStep}
              onSelect={(e) => setActiveStep(e.index)}
              readOnly={false}
              style={{ marginBottom: "3rem" }}
            />

            {/* Step 1: Destination */}
            {activeStep === 0 && (
              <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "1.5rem" }}>
                  Where do you want to go?
                </h3>
                <Dropdown
                  id="destination-select"
                  value={destination}
                  options={DESTINATIONS}
                  onChange={(e) => setDestination(e.value)}
                  placeholder="Search for a city..."
                  filter
                  filterPlaceholder="Type to search"
                  className="w-full"
                  style={{ fontSize: "1.15rem", padding: "0.2rem" }}
                />
                {destination && (
                  <div
                    style={{
                      marginTop: "1.5rem",
                      padding: "1rem 1.5rem",
                      borderRadius: "12px",
                      ...SELECTED_STYLE,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    <i className="pi pi-map-marker" />
                    {destination}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Budget & Time */}
            {activeStep === 1 && (
              <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "2rem" }}>
                  Budget & Travel Dates
                </h3>

                {/* Budget slider — BIG */}
                <div style={{ marginBottom: "2.5rem" }}>
                  <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Budget:{" "}
                    <span style={{ color: "#7ec8e3", fontWeight: 900, fontSize: "1.6rem" }}>
                      ${budget}
                    </span>
                  </label>
                  <Slider
                    value={budget}
                    onChange={(e) => setBudget(e.value as number)}
                    min={100}
                    max={10000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-content-between" style={{ fontSize: "0.9rem", color: "#8a9b8a", marginTop: "0.75rem" }}>
                    <span>$100</span>
                    <span>$10,000</span>
                  </div>
                </div>

                {/* Calendar — with date validation note */}
                <div>
                  <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Travel Dates{" "}
                    <span style={{ color: "#8a9b8a", fontWeight: 500, fontSize: "0.9rem" }}>(optional — defaults to 3 days)</span>
                  </label>
                  <Calendar
                    id="date-range"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.value as Date[] | null)}
                    selectionMode="range"
                    readOnlyInput
                    placeholder="Select date range"
                    className="w-full"
                    minDate={new Date()}
                    maxDate={new Date(new Date().setDate(new Date().getDate() + 21))}
                    dateFormat="dd M yy"
                    style={{ fontSize: "1.05rem" }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Vibe Check */}
            {activeStep === 2 && (
              <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "2rem" }}>
                  What are you into?
                </h3>

                {/* Interest selection — CHUNKY pills with custom selection states */}
                <div style={{ marginBottom: "2.5rem" }}>
                  <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.value);
                      return (
                        <button
                          key={interest.value}
                          onClick={() => {
                            setSelectedInterests((prev) =>
                              isSelected
                                ? prev.filter((v) => v !== interest.value)
                                : [...prev, interest.value]
                            );
                          }}
                          style={{
                            /* Inflating these buttons like it's 2008 and we're in a housing bubble */
                            padding: "0.75rem 1.5rem",
                            borderRadius: "12px",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            ...(isSelected ? SELECTED_STYLE : IDLE_STYLE),
                          }}
                        >
                          {interest.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Travel pace — custom chunky selector */}
                <div>
                  <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                    Travel Pace
                  </label>
                  <div className="flex gap-3">
                    {PACE_OPTIONS.map((option) => {
                      const isSelected = pace === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setPace(option.value)}
                          style={{
                            padding: "0.85rem 2rem",
                            borderRadius: "12px",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            flex: 1,
                            ...(isSelected ? SELECTED_STYLE : IDLE_STYLE),
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons — CHUNKY */}
            <div className="flex justify-content-between" style={{ marginTop: "3rem" }}>
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-text"
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                style={{ color: "#5a6b5a", fontSize: "1.05rem", padding: "0.75rem 1.5rem" }}
              />
              {activeStep < 2 ? (
                <Button
                  label="Next"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={() => setActiveStep((s) => s + 1)}
                  disabled={!canProceed()}
                  style={{ fontSize: "1.05rem", padding: "0.75rem 2rem" }}
                />
              ) : (
                <button
                  id="plan-trip-button"
                  onClick={planTrip}
                  disabled={!destination}
                  style={{
                    /*
                     * The Big Green Button.
                     * This lime green is so bright it might actually fix my
                     * seasonal depression. Also it's CHUNKY.
                     */
                    padding: "1rem 2.5rem",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    border: "none",
                    borderRadius: "14px",
                    cursor: destination ? "pointer" : "not-allowed",
                    background: destination
                      ? "linear-gradient(135deg, #d1f0b1 0%, #a3d980 100%)"
                      : "#e0e0e0",
                    color: destination ? "#1a2e1a" : "#999",
                    boxShadow: destination ? "0 4px 20px rgba(163, 217, 128, 0.4)" : "none",
                    transition: "all 0.25s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!destination) return;
                    (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #7ec8e3 0%, #5bb8d9 100%)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(126, 200, 227, 0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    if (!destination) return;
                    (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #d1f0b1 0%, #a3d980 100%)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#1a2e1a";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(163, 217, 128, 0.4)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  <i className="pi pi-send" />
                  Plan My Trip
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Error Message ── */}
        {error && (
          <div style={{ marginBottom: "2.5rem" }}>
            <Message severity="error" text={error} style={{ width: "100%", fontSize: "1.05rem" }} />
            <Button
              label="Try Again"
              icon="pi pi-refresh"
              className="mt-3"
              onClick={() => { setError(null); setEvents([]); }}
              style={{ display: "block", margin: "1.25rem auto 0", fontSize: "1.05rem" }}
            />
          </div>
        )}

        {/* ── Timeline Results — BIG CARDS ── */}
        {events.length > 0 && (
          <div style={{ animation: "fadeInUp 0.5s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#1a2e1a", marginBottom: "0.6rem" }}>
                Your Personalized Itinerary
              </h2>
              <p style={{ color: "#5a6b5a", fontSize: "1.1rem" }}>
                {destination} — ${budget} budget — {pace} pace
              </p>
            </div>

            <Timeline
              value={events}
              align="alternate"
              marker={markerTemplate}
              content={contentTemplate}
            />

            {/* Plan another trip button — also CHUNKY */}
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <button
                onClick={() => {
                  setEvents([]);
                  setActiveStep(0);
                  setDestination(null);
                  setBudget(500);
                  setDateRange(null);
                  setSelectedInterests([]);
                  setPace("moderate");
                }}
                style={{
                  padding: "0.9rem 2.2rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  border: "2px solid #d1f0b1",
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#2a5a2a",
                  transition: "all 0.25s",
                }}
              >
                <i className="pi pi-refresh" style={{ marginRight: "0.5rem" }} />
                Plan Another Trip
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
