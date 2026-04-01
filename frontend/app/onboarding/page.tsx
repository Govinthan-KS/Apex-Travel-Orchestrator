/*
 * Onboarding Page — onboarding/page.tsx
 * ========================================
 * The DNA extraction lab. Where we figure out if you're
 * a "budget backpacker eating street food" or a
 * "first-class champagne sipper with a personal concierge."
 *
 * BIG & BOLD edition — same chunky, cotton-candy styling
 * as the trip planner dashboard. Because consistency matters.
 *
 * After completion, calls useSession().update() to refresh
 * the JWT so the dashboard stops redirecting you back here.
 * We learned about JWT staleness the hard way.
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import { submitOnboarding } from "./actions";
import type { OnboardingData } from "./actions";

/* ──────────────────────────────────────────────────────────── */
/* Option Configs                                               */
/* ──────────────────────────────────────────────────────────── */

const DIETARY_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Halal", value: "halal" },
  { label: "Kosher", value: "kosher" },
  { label: "Gluten-Free", value: "gluten-free" },
];

const ACCESSIBILITY_OPTIONS = [
  { label: "Wheelchair", value: "wheelchair" },
  { label: "Visual Aid", value: "visual_aid" },
  { label: "Hearing Aid", value: "hearing_aid" },
  { label: "Mobility Support", value: "mobility_support" },
  { label: "None", value: "none" },
];

const FLIGHT_CLASS_OPTIONS = [
  { label: "Economy", value: "economy" },
  { label: "Premium Eco", value: "premium_economy" },
  { label: "Business", value: "business" },
  { label: "First Class", value: "first" },
];

const STAY_TIER_OPTIONS = [
  { label: "Budget", value: "budget" },
  { label: "Mid-Range", value: "mid_range" },
  { label: "Luxury", value: "luxury" },
  { label: "Resort", value: "resort" },
];

const PACE_OPTIONS = [
  { label: "🐢 Relaxed", value: "relaxed" },
  { label: "⚖️ Moderate", value: "moderate" },
  { label: "🚀 Intensive", value: "intensive" },
];

const INTEREST_OPTIONS = [
  { label: "🏛️ Culture", value: "culture" },
  { label: "🧗 Adventure", value: "adventure" },
  { label: "🍜 Food", value: "food" },
  { label: "🌙 Nightlife", value: "nightlife" },
  { label: "🌿 Nature", value: "nature" },
  { label: "🛍️ Shopping", value: "shopping" },
  { label: "🧘 Relaxation", value: "relaxation" },
];

/* ──────────────────────────────────────────────────────────── */
/* Selection State Styles — same as Dashboard                   */
/* ──────────────────────────────────────────────────────────── */

const SELECTED_STYLE: React.CSSProperties = {
  background: "#7ec8e3",
  color: "#ffffff",
  border: "2px solid #a3d980",
  transform: "scale(1.03)",
  boxShadow: "0 4px 16px rgba(126, 200, 227, 0.4)",
};

const IDLE_STYLE: React.CSSProperties = {
  background: "#f0f9e8",
  color: "#5a6b5a",
  border: "2px solid transparent",
};

/* Step labels */
const STEPS = [
  { label: "The Anchors", desc: "Hard constraints — the deal-breakers" },
  { label: "The Vibes", desc: "Soft preferences — the nice-to-haves" },
  { label: "Review", desc: "Make sure we got it right" },
];

/* ──────────────────────────────────────────────────────────── */
/* Component                                                    */
/* ──────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  /* ── Step 1: Hard Constraints ── */
  const [dietary, setDietary] = useState("none");
  const [homeHub, setHomeHub] = useState("");
  const [accessibility, setAccessibility] = useState<string[]>([]);

  /* ── Step 2: Soft Preferences ── */
  const [travelPace, setTravelPace] = useState("moderate");
  const [flightClass, setFlightClass] = useState("economy");
  const [stayTier, setStayTier] = useState("mid_range");
  const [interests, setInterests] = useState<string[]>([]);

  /* ── Submit Handler ── */
  const handleSubmit = async () => {
    if (!homeHub.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Missing Field",
        detail: "Please enter your Home Hub airport code.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const data: OnboardingData = {
        dietary,
        homeHub: homeHub.trim().toUpperCase(),
        accessibility: accessibility.filter((a) => a !== "none"),
        travelPace,
        flightClass,
        stayTier,
        interests,
      };

      const result = await submitOnboarding(data);

      if (result.success) {
        toast.current?.show({
          severity: "success",
          summary: "All Set! 🎉",
          detail: "Your travel DNA has been saved. Redirecting to the cockpit...",
          life: 2500,
        });

        /*
         * THIS IS THE CRITICAL LINE.
         * Calling update() refreshes the JWT token. The jwt callback
         * re-checks the surveys collection and clears needsOnboarding.
         * Without this, the dashboard would keep redirecting you back
         * here forever. We learned this the hard way.
         */
        await updateSession();

        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: result.error || "Failed to save preferences.",
          life: 4000,
        });
        setLoading(false);
      }
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Something went wrong. Please try again.",
        life: 4000,
      });
      setLoading(false);
    }
  };

  /* ── Get label from option value ── */
  const getLabel = (options: { label: string; value: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  /* ════════════════════════════════════════════════════════════ */
  /* Render — BIG & BOLD, same DNA as the dashboard              */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <>
      <Toast ref={toast} position="top-right" />

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7ec8e3, #a3d980)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              boxShadow: "0 4px 20px rgba(126, 200, 227, 0.35)",
            }}
          >
            <i className="pi pi-compass" style={{ fontSize: "2rem", color: "#ffffff" }} />
          </div>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: 900,
              color: "#1a2e1a",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Set Up Your Travel DNA
          </h1>
          <p style={{ color: "#5a6b5a", fontSize: "1.2rem", marginTop: "0.6rem" }}>
            Help our agents plan the perfect trip for you
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex justify-content-center gap-3" style={{ marginBottom: "2.5rem" }}>
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                ...(step === i ? SELECTED_STYLE : IDLE_STYLE),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Form Card ── */}
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
          {/* ════════ STEP 1: THE ANCHORS ════════ */}
          {step === 0 && (
            <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem" }}>
                The Anchors
              </h3>
              <p style={{ color: "#5a6b5a", fontSize: "1rem", marginBottom: "2rem" }}>
                These are the deal-breakers — the stuff we absolutely need to know.
              </p>

              {/* Dietary */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-heart" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Dietary Preference
                </label>
                <div className="flex flex-wrap gap-3">
                  {DIETARY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDietary(opt.value)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        ...(dietary === opt.value ? SELECTED_STYLE : IDLE_STYLE),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-shield" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Accessibility Needs
                </label>
                <div className="flex flex-wrap gap-3">
                  {ACCESSIBILITY_OPTIONS.map((opt) => {
                    const isSelected = accessibility.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setAccessibility((prev) =>
                            isSelected ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                          );
                        }}
                        style={{
                          padding: "0.75rem 1.5rem",
                          borderRadius: "12px",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          ...(isSelected ? SELECTED_STYLE : IDLE_STYLE),
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Home Hub */}
              <div>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-map-marker" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Home Hub Airport Code
                </label>
                <InputText
                  value={homeHub}
                  onChange={(e) => setHomeHub(e.target.value)}
                  placeholder="e.g. JFK, LHR, MAA"
                  className="w-full"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    padding: "0.85rem 1.2rem",
                    borderRadius: "12px",
                    border: "2px solid #e8f8d8",
                  }}
                />
              </div>
            </div>
          )}

          {/* ════════ STEP 2: THE VIBES ════════ */}
          {step === 1 && (
            <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem" }}>
                The Vibes
              </h3>
              <p style={{ color: "#5a6b5a", fontSize: "1rem", marginBottom: "2rem" }}>
                The nice-to-haves. Tell us how you like to travel.
              </p>

              {/* Travel Pace */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-bolt" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Travel Pace
                </label>
                <div className="flex gap-3">
                  {PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTravelPace(opt.value)}
                      style={{
                        padding: "0.85rem 2rem",
                        borderRadius: "12px",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flex: 1,
                        ...(travelPace === opt.value ? SELECTED_STYLE : IDLE_STYLE),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flight Class */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-send" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Preferred Flight Class
                </label>
                <div className="flex flex-wrap gap-3">
                  {FLIGHT_CLASS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFlightClass(opt.value)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        ...(flightClass === opt.value ? SELECTED_STYLE : IDLE_STYLE),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stay Tier */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-building" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Preferred Stay Tier
                </label>
                <div className="flex flex-wrap gap-3">
                  {STAY_TIER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStayTier(opt.value)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        ...(stayTier === opt.value ? SELECTED_STYLE : IDLE_STYLE),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label style={{ fontWeight: 700, color: "#3a4a3a", display: "block", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <i className="pi pi-star" style={{ color: "#7ec8e3", marginRight: "0.5rem" }} />
                  Interests
                </label>
                <MultiSelect
                  value={interests}
                  onChange={(e) => setInterests(e.value)}
                  options={INTEREST_OPTIONS}
                  placeholder="Select your interests"
                  display="chip"
                  className="w-full"
                  style={{ fontSize: "1.05rem", borderRadius: "12px", border: "2px solid #e8f8d8" }}
                />
              </div>
            </div>
          )}

          {/* ════════ STEP 3: REVIEW ════════ */}
          {step === 2 && (
            <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem" }}>
                Review Your Travel DNA
              </h3>
              <p style={{ color: "#5a6b5a", fontSize: "1rem", marginBottom: "2rem" }}>
                Make sure everything looks right before we save it.
              </p>

              {/* Anchors Summary */}
              <div
                style={{
                  background: "#d1f0b120",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  borderLeft: "5px solid #a3d980",
                  marginBottom: "1.5rem",
                }}
              >
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2a5a2a", marginBottom: "1rem", marginTop: 0 }}>
                  🎯 The Anchors
                </h4>
                <div className="flex flex-column gap-3" style={{ fontSize: "1.05rem", color: "#3a4a3a" }}>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-heart" style={{ color: "#7ec8e3" }} />
                    <strong>Dietary:</strong> {getLabel(DIETARY_OPTIONS, dietary)}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-map-marker" style={{ color: "#7ec8e3" }} />
                    <strong>Home Hub:</strong> {homeHub.toUpperCase() || "—"}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-shield" style={{ color: "#7ec8e3" }} />
                    <strong>Accessibility:</strong>{" "}
                    {accessibility.length > 0
                      ? accessibility.map((a) => getLabel(ACCESSIBILITY_OPTIONS, a)).join(", ")
                      : "None"}
                  </div>
                </div>
              </div>

              {/* Vibes Summary */}
              <div
                style={{
                  background: "#7ec8e315",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  borderLeft: "5px solid #7ec8e3",
                }}
              >
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a4a6a", marginBottom: "1rem", marginTop: 0 }}>
                  ✨ The Vibes
                </h4>
                <div className="flex flex-column gap-3" style={{ fontSize: "1.05rem", color: "#3a4a3a" }}>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-bolt" style={{ color: "#a3d980" }} />
                    <strong>Pace:</strong> {getLabel(PACE_OPTIONS, travelPace)}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-send" style={{ color: "#a3d980" }} />
                    <strong>Flight:</strong> {getLabel(FLIGHT_CLASS_OPTIONS, flightClass)}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-building" style={{ color: "#a3d980" }} />
                    <strong>Stay:</strong> {getLabel(STAY_TIER_OPTIONS, stayTier)}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-star" style={{ color: "#a3d980" }} />
                    <strong>Interests:</strong>{" "}
                    {interests.length > 0
                      ? interests.map((i) => getLabel(INTEREST_OPTIONS, i)).join(", ")
                      : "None selected"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation — CHUNKY, same as dashboard ── */}
          <div className="flex justify-content-between" style={{ marginTop: "3rem" }}>
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ color: "#5a6b5a", fontSize: "1.05rem", padding: "0.75rem 1.5rem" }}
            />

            {step < 2 ? (
              <Button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                onClick={() => setStep((s) => s + 1)}
                style={{ fontSize: "1.05rem", padding: "0.75rem 2rem" }}
              />
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !homeHub.trim()}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  border: "none",
                  borderRadius: "14px",
                  cursor: homeHub.trim() && !loading ? "pointer" : "not-allowed",
                  background: homeHub.trim() && !loading
                    ? "linear-gradient(135deg, #d1f0b1 0%, #a3d980 100%)"
                    : "#e0e0e0",
                  color: homeHub.trim() && !loading ? "#1a2e1a" : "#999",
                  boxShadow: homeHub.trim() && !loading ? "0 4px 20px rgba(163, 217, 128, 0.4)" : "none",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                {loading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="pi pi-check" />
                    Confirm
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
