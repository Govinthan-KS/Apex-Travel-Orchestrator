/*
 * Profile Page — profile/page.tsx
 * =================================
 * Where users can admire their Logistics DNA and pretend 
 * they've been to more countries than they actually have.
 *
 * Shows:
 *   - User card (name, email, avatar)
 *   - Logistics DNA breakdown (from /api/prepare-session)
 *   - "Past Adventures" trip history placeholder
 *
 * This page is the digital equivalent of a passport — except
 * it won't get you through customs.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { Timeline } from "primereact/timeline";

/* ── Types ── */
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
  metadata: {
    last_login: string;
    version: string;
  };
}

/* DNA display labels — because raw keys look ugly */
const DNA_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  home_hub: { icon: "pi pi-home", label: "Home Hub", color: "#7ec8e3" },
  dietary: { icon: "pi pi-heart", label: "Dietary", color: "#a3d980" },
  travel_pace: { icon: "pi pi-bolt", label: "Travel Pace", color: "#d1f0b1" },
  accessibility: { icon: "pi pi-shield", label: "Accessibility", color: "#f7d9d9" },
};

/* Placeholder past trips — in production these would come from a database */
const PAST_TRIPS: any[] = [];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dna, setDna] = useState<LogisticsDna | null>(null);
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [loadingDna, setLoadingDna] = useState(true);

  const IATA_TO_CITY: Record<string, string> = {
    "MAA": "Chennai", "NRT": "Tokyo", "BLR": "Bangalore",
    "LHR": "London", "JFK": "New York", "DEL": "Delhi",
    "IXC": "Chandigarh", "BOM": "Mumbai", "DXB": "Dubai",
    "SIN": "Singapore", "CDG": "Paris", "BKK": "Bangkok",
    "SYD": "Sydney", "FCO": "Rome", "BER": "Berlin",
    "YYZ": "Toronto", "BCN": "Barcelona", "LAX": "Los Angeles",
  };

  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  /* ── Timeline marker renderer (Sky Blue circles) ── */
  const markerTemplate = (item: any) => (
    <span
      className="flex align-items-center justify-content-center border-circle"
      style={{
        backgroundColor: "#7ec8e3",
        width: "3rem",
        height: "3rem",
        color: "#ffffff",
        boxShadow: `0 0 18px ${item.color || "#7ec8e3"}45`,
      }}
    >
      <i className={item.icon} style={{ fontSize: "1.2rem" }} />
    </span>
  );

  /* ── Timeline content renderer (Lime Green / Blue backgrounds) ── */
  const contentTemplate = (item: any) => (
    <Card
      title={item.status}
      subTitle={item.date}
      style={{
        marginBottom: "1.5rem",
        background: item.icon.includes("wallet") ? "#e8f1ff" : "#d1f0b140",
        borderLeft: `5px solid ${item.color || "#7ec8e3"}`,
        borderRadius: "16px",
        padding: "0.2rem",
      }}
    >
      <p style={{ lineHeight: 1.6, color: "#3a4a3a", margin: 0, fontSize: "0.95rem" }}>
        {item.description}
      </p>
    </Card>
  );

  /* ── Fetch Logistics DNA on mount ── */
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

  /* ── Fetch Real Trip History ── */
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

  /* ── Get the top preference from a weights map ── */
  const getTopPref = (weights: Record<string, number>): string => {
    const entries = Object.entries(weights);
    if (entries.length === 0) return "Not set";
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (status === "loading" || loadingDna) {
    return (
      <main className="flex align-items-center justify-content-center" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "4px solid #e8f8d8", borderTop: "4px solid #a3d980", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "#5a6b5a" }}>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {/* ══════════════════════════════════════════════════════
          User Card — the fancy ID badge
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "linear-gradient(135deg, #d1f0b130 0%, #c4e8f530 100%)",
          borderRadius: "20px",
          padding: "2.5rem",
          border: "2px solid #d1f0b140",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7ec8e3, #a3d980)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(126, 200, 227, 0.3)",
            flexShrink: 0,
          }}
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <i className="pi pi-user" style={{ fontSize: "2rem", color: "#fff" }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1a2e1a", margin: 0, lineHeight: 1.2 }}>
            {session?.user?.name ?? "Traveler"}
          </h1>
          <p style={{ color: "#5a6b5a", fontSize: "1rem", marginTop: "0.3rem" }}>
            {session?.user?.email ?? ""}
          </p>
          {dna && (
            <div className="flex gap-2 flex-wrap" style={{ marginTop: "0.75rem" }}>
              <span style={{ padding: "0.25rem 0.8rem", borderRadius: "8px", background: "#d1f0b1", color: "#2a5a2a", fontSize: "0.8rem", fontWeight: 700 }}>
                User Profile
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Logistics DNA — the personality breakdown
          ══════════════════════════════════════════════════════ */}
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "1.25rem" }}>
        <i className="pi pi-id-card" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
        Your Logistics DNA
      </h2>

      {dnaError && (
        <Message severity="warn" text={dnaError} style={{ width: "100%", marginBottom: "1.5rem" }} />
      )}

      {dna && (
        <div className="flex flex-wrap gap-3" style={{ marginBottom: "3rem" }}>
          {/* Hard Constraints */}
          {Object.entries(DNA_LABELS).map(([key, meta]) => {
            const val = dna.constraints[key as keyof typeof dna.constraints];
            let display = Array.isArray(val) ? (val.length > 0 ? val.join(", ") : "None") : String(val);
            if (key === "home_hub") {
              display = IATA_TO_CITY[String(val).toUpperCase()] || String(val);
            }
            return (
              <div
                key={key}
                style={{
                  flex: "1 1 200px",
                  padding: "1.25rem",
                  borderRadius: "14px",
                  background: "#ffffff",
                  border: `2px solid ${meta.color}30`,
                  boxShadow: `0 2px 12px ${meta.color}12`,
                }}
              >
                <div className="flex align-items-center gap-2" style={{ marginBottom: "0.5rem" }}>
                  <i className={meta.icon} style={{ color: meta.color, fontSize: "1.1rem" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {meta.label}
                  </span>
                </div>
                <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a2e1a", margin: 0, textTransform: "capitalize" }}>
                  {display}
                </p>
              </div>
            );
          })}

          {/* Soft Preferences */}
          <div style={{ flex: "1 1 200px", padding: "1.25rem", borderRadius: "14px", background: "#ffffff", border: "2px solid #7ec8e330", boxShadow: "0 2px 12px #7ec8e312" }}>
            <div className="flex align-items-center gap-2" style={{ marginBottom: "0.5rem" }}>
              <i className="pi pi-send" style={{ color: "#7ec8e3", fontSize: "1.1rem" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Flight Class</span>
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a2e1a", margin: 0 }}>
              {getTopPref(dna.weights.flight_class)}
            </p>
          </div>

          <div style={{ flex: "1 1 200px", padding: "1.25rem", borderRadius: "14px", background: "#ffffff", border: "2px solid #a3d98030", boxShadow: "0 2px 12px #a3d98012" }}>
            <div className="flex align-items-center gap-2" style={{ marginBottom: "0.5rem" }}>
              <i className="pi pi-building" style={{ color: "#a3d980", fontSize: "1.1rem" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Stay Tier</span>
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a2e1a", margin: 0 }}>
              {getTopPref(dna.weights.stay_tier)}
            </p>
          </div>

          {/* Interests */}
          <div style={{ flex: "1 1 420px", padding: "1.25rem", borderRadius: "14px", background: "#ffffff", border: "2px solid #d1f0b130", boxShadow: "0 2px 12px #d1f0b112" }}>
            <div className="flex align-items-center gap-2" style={{ marginBottom: "0.5rem" }}>
              <i className="pi pi-heart" style={{ color: "#d1f0b1", fontSize: "1.1rem" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Interests</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {dna.weights.interests.length > 0
                ? dna.weights.interests.map((interest) => (
                    <span key={interest} style={{ padding: "0.3rem 0.8rem", borderRadius: "8px", background: "#d1f0b1", color: "#2a5a2a", fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>
                      {interest}
                    </span>
                  ))
                : <span style={{ color: "#8a9b8a" }}>No interests selected</span>}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Past Adventures — the brag section
          ══════════════════════════════════════════════════════ */}
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "1.25rem" }}>
        <i className="pi pi-map" style={{ color: "#a3d980", marginRight: "0.5rem" }} />
        Past Adventures
      </h2>

      <div className="flex flex-column gap-3">
        {loadingTrips ? (
          <p style={{ textAlign: "center", color: "#8a9b8a" }}>Loading trips...</p>
        ) : trips.length > 0 ? (
          trips.map((trip: any, i: number) => (
            <div
              key={trip._id}
              style={{
                borderLeft: `5px solid ${i % 2 === 0 ? "#7ec8e3" : "#d1f0b1"}`,
                borderRadius: "14px",
                background: i % 2 === 0 ? "#f8fdff" : "#f8fdf4",
                padding: "1.25rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div className="flex align-items-center gap-3">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: i % 2 === 0 ? "#7ec8e3" : "#d1f0b1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="pi pi-globe" style={{ fontSize: "1.4rem", color: i % 2 === 0 ? "#fff" : "#2a5a2a" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1a2e1a", margin: "0 0 0.3rem 0", textTransform: "capitalize" }}>
                    {trip.destination}
                  </h3>
                  <p style={{ color: "#5a6b5a", fontSize: "0.9rem", margin: 0 }}>
                    {trip.date} · {trip.days} days · ${trip.budget}
                  </p>
                </div>
              </div>
              <Button
                label="View Trip"
                icon="pi pi-eye"
                className="p-button-outlined"
                style={{ color: "#2a5a2a", borderColor: "#a3d980", borderRadius: "8px", padding: "0.5rem 1rem", fontWeight: 700 }}
                onClick={() => setSelectedTrip(trip)}
              />
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#8a9b8a", fontSize: "0.8rem", marginTop: "2rem" }}>
            Trip history will populate as you use the planner within budget. No trips stored yet!
          </p>
        )}
      </div>

      {/* ── View Trip Dialog ── */}
      <Dialog 
        header={
          <div style={{ width: "100%", textAlign: "center", paddingRight: "2rem" }}>
            <span style={{ fontWeight: 800, color: "#1a2e1a", textTransform: "capitalize", fontSize: "1.5rem" }}>
              <i className="pi pi-map-marker" style={{color: "#a3d980", marginRight: "0.5rem"}}></i>
              {selectedTrip?.destination} Itinerary
            </span>
          </div>
        }
        visible={!!selectedTrip}
        style={{ width: '90vw', maxWidth: '800px' }}
        modal
        onHide={() => setSelectedTrip(null)}
        dismissableMask={true}
      >
        <div style={{ padding: "1rem 0" }}>
          <Timeline
            value={selectedTrip?.itinerary || []}
            align="alternate"
            marker={markerTemplate}
            content={contentTemplate}
          />
        </div>
      </Dialog>
    </main>
  );
}
