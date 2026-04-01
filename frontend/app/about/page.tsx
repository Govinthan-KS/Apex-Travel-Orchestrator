/*
 * About Page — about/page.tsx
 * ============================
 * The page where we flex our tech stack and pretend we planned
 * all of this from the start. Spoiler: we didn't.
 */

"use client";

/* ── Architecture sections — what powers this lime-green beast ── */
const ARCHITECTURE = [
  {
    title: "Llama 3.3 70B via Groq",
    icon: "pi pi-bolt",
    color: "#7ec8e3",
    items: [
      "70 billion parameter LLM running on Groq's LPU hardware",
      "LangChain ReAct agents for structured reasoning chains",
      "4 specialized agents: Coordinator, Flight, Hotel, Attraction",
      "Context-aware system prompts with XML injection blocks",
    ],
  },
  {
    title: "Pinecone Vector DB",
    icon: "pi pi-database",
    color: "#a3d980",
    items: [
      "384-dimension cosine similarity index (apex-user-memory)",
      "Per-user namespace isolation — your vibes stay yours",
      "Local embeddings via all-MiniLM-L6-v2 (~90ms per encode)",
      "Semantic memory retrieval for personalized recommendations",
    ],
  },
  {
    title: "MongoDB + Auth.js",
    icon: "pi pi-server",
    color: "#f7d9d9",
    items: [
      "Logistics DNA: surveys + frequencyweights collections",
      "Google OAuth via Auth.js with session management",
      "Hard Constraints: dietary, home_hub, accessibility, pace",
      "Soft Preferences: flight_class, stay_tier, interests weights",
    ],
  },
  {
    title: "HMAC-SHA256 Security",
    icon: "pi pi-shield",
    color: "#d1f0b1",
    items: [
      "Frontend signs DNA payload with shared secret",
      "Backend verifies X-Apex-Signature header before Groq calls",
      "Deterministic JSON serialization across Node.js and Python",
      "403 Forbidden on mismatch — protects API credits",
    ],
  },
];

const DATA_FLOW = [
  { step: "1", label: "User signs in via Google OAuth", color: "#7ec8e3" },
  { step: "2", label: "Onboarding survey saves Logistics DNA to MongoDB", color: "#a3d980" },
  { step: "3", label: "Vibes are vectorized locally and stored in Pinecone", color: "#d1f0b1" },
  { step: "4", label: "Dashboard fetches DNA + signs it with HMAC-SHA256", color: "#f7d9d9" },
  { step: "5", label: "Python backend verifies signature, injects context into Llama 3.3", color: "#7ec8e3" },
  { step: "6", label: "Coordinator delegates to specialists with DNA constraints", color: "#a3d980" },
  { step: "7", label: "JSON itinerary rendered as PrimeReact Timeline", color: "#d1f0b1" },
];

export default function AboutPage() {
  return (
    <main style={{ maxWidth: "950px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div
          style={{
            display: "inline-block",
            padding: "0.3rem 1rem",
            background: "#d1f0b1",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#2a5a2a",
            marginBottom: "1rem",
            letterSpacing: "0.5px",
          }}
        >
          ARCHITECTURE DEEP DIVE
        </div>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            color: "#1a2e1a",
            lineHeight: 1.1,
            marginBottom: "0.75rem",
          }}
        >
          How Apex Travel Orchestrator Works
        </h1>
        <p style={{ color: "#5a6b5a", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          A multi-agent AI system that reads your personality, remembers your
          preferences, and builds trips that actually match who you are.
        </p>
      </div>

      {/* ── Architecture Cards ── */}
      <div className="flex flex-wrap gap-4" style={{ marginBottom: "4rem" }}>
        {ARCHITECTURE.map((section) => (
          <div
            key={section.title}
            style={{
              flex: "1 1 400px",
              padding: "2rem",
              borderRadius: "16px",
              background: "#ffffff",
              border: `2px solid ${section.color}30`,
              boxShadow: `0 4px 20px ${section.color}15`,
            }}
          >
            <div className="flex align-items-center gap-3" style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  background: section.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className={section.icon} style={{ fontSize: "1.2rem", color: "#fff" }} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1a2e1a", margin: 0 }}>
                {section.title}
              </h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {section.items.map((item, i) => (
                <li
                  key={i}
                  className="flex align-items-start gap-2"
                  style={{ marginBottom: "0.6rem", fontSize: "0.9rem", color: "#4a5a4a", lineHeight: 1.5 }}
                >
                  <i className="pi pi-check" style={{ color: section.color, marginTop: "3px", fontSize: "0.8rem" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Data Flow ── */}
      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.6rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "2rem" }}>
          End-to-End Data Flow
        </h2>
        <div style={{ maxWidth: "650px", margin: "0 auto" }}>
          {DATA_FLOW.map((item, i) => (
            <div key={i} className="flex align-items-start gap-3" style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  color: "#1a2e1a",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <p style={{ fontSize: "0.95rem", color: "#4a5a4a", lineHeight: 1.6, margin: 0, paddingTop: "6px" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div style={{ textAlign: "center", padding: "2rem", color: "#8a9b8a", fontSize: "0.85rem" }}>
        Built with a truly unreasonable amount of caffeine and an appreciation for lime green.
      </div>
    </main>
  );
}
