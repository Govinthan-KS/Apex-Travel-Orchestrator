/*
 * Landing Page — page.tsx
 * ========================
 * The first thing users see. If this doesn't make them go "ooh",
 * we've failed as a species. 5+ sections of lime-green glory.
 *
 * Sections:
 *   1. Hero with floating blobs
 *   2. "How It Works" steps
 *   3. The Agents showcase
 *   4. The Tech Stack
 *   5. CTA
 */

"use client";

import Link from "next/link";

/* ── The agents that power this chaotic operation ── */
const AGENTS = [
  {
    name: "The Coordinator",
    role: "Strategic Orchestrator",
    icon: "pi pi-sitemap",
    desc: "The mastermind who reads your DNA, fetches your memories, and delegates tasks to the specialists with military precision.",
    color: "#7ec8e3",
  },
  {
    name: "Flight Specialist",
    role: "Sky Navigator",
    icon: "pi pi-send",
    desc: "Finds the perfect flights from your Home Hub. Knows every IATA code by heart and never defaults to Delhi anymore.",
    color: "#a3d980",
  },
  {
    name: "Hotel Specialist",
    role: "Tier-Based Curator",
    icon: "pi pi-building",
    desc: "Judges your budget, respects your tier preference, and won't let you stay in a 2-star if you said Luxury.",
    color: "#f7d9d9",
  },
  {
    name: "Attraction Specialist",
    role: "Interest Curator",
    icon: "pi pi-map-marker",
    desc: "Curates landmarks based on YOUR interests. Love food? Expect 2+ markets minimum. Love nightlife? We approve.",
    color: "#d1f0b1",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Onboard", desc: "Tell us your dietary needs, home airport, and travel style.", icon: "pi pi-user-edit" },
  { step: "02", title: "Drop a Vibe", desc: "Share your dream trip vibes. Our Pinecone memory stores them forever.", icon: "pi pi-heart" },
  { step: "03", title: "Plan", desc: "Pick a destination, budget, and dates. The AI team handles the rest.", icon: "pi pi-bolt" },
  { step: "04", title: "Travel", desc: "Get a personalized day-by-day itinerary that actually matches YOU.", icon: "pi pi-globe" },
];

export default function Home() {
  return (
    <main style={{ overflow: "hidden" }}>
      {/* ════════════════════════════════════════════════════════
          SECTION 1 — Hero with floating lime-green blobs
          These blobs are a vibe. Do not remove them.
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          overflow: "hidden",
        }}
      >
        {/* Blob 1 — top right, lime green, floating like my attention span */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-80px",
            width: "340px",
            height: "340px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #d1f0b1 0%, transparent 70%)",
            opacity: 0.6,
            animation: "blobFloat 8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        {/* Blob 2 — bottom left, sky blue */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            left: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #7ec8e3 0%, transparent 70%)",
            opacity: 0.5,
            animation: "blobFloat2 10s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        {/* Blob 3 — center-ish, subtle lime */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #d1f0b1 0%, transparent 70%)",
            opacity: 0.3,
            animation: "blobFloat 12s ease-in-out infinite reverse",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, animation: "fadeInUp 0.8s ease-out" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.4rem 1.2rem",
              background: "#d1f0b1",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#2a5a2a",
              marginBottom: "1.5rem",
              letterSpacing: "0.5px",
            }}
          >
            POWERED BY LLAMA 3.3 70B + MULTI-AGENT ORCHESTRATION
          </div>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#1a2e1a",
              marginBottom: "1.2rem",
              letterSpacing: "-1px",
            }}
          >
            Your Travel Plans,
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #7ec8e3 0%, #a3d980 50%, #d1f0b1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI-Orchestrated
            </span>
          </h1>
          <p
            style={{
              fontSize: "1.15rem",
              color: "#5a6b5a",
              maxWidth: "560px",
              margin: "0 auto 2rem",
              lineHeight: 1.7,
            }}
          >
            Four AI specialists work together to build personalized itineraries
            that honor your dietary needs, travel pace, and budget — not just
            the most Instagrammable spots.
          </p>
          <div className="flex gap-3 justify-content-center flex-wrap">
            <Link href="/dashboard">
              <button
                style={{
                  padding: "0.9rem 2.2rem",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #7ec8e3, #5bb8d9)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(126, 200, 227, 0.4)",
                  transition: "all 0.25s",
                }}
              >
                <i className="pi pi-send" style={{ marginRight: "0.5rem" }} />
                Plan Your Trip
              </button>
            </Link>
            <Link href="/about">
              <button
                style={{
                  padding: "0.9rem 2.2rem",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  border: "2px solid #d1f0b1",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#2a5a2a",
                  transition: "all 0.25s",
                }}
              >
                How It Works
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — How It Works
          4 steps. Simple. Clean. Like my code (sometimes).
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#1a2e1a",
            marginBottom: "0.5rem",
          }}
        >
          How It Works
        </h2>
        <p style={{ color: "#5a6b5a", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Four steps to your dream trip. No spreadsheets required.
        </p>
        <div
          className="flex justify-content-center flex-wrap gap-4"
          style={{ maxWidth: "1000px", margin: "0 auto" }}
        >
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              style={{
                flex: "1 1 200px",
                maxWidth: "230px",
                padding: "2rem 1.5rem",
                borderRadius: "16px",
                background: "#f8fdf4",
                border: "1px solid #e8f8d8",
                animation: "fadeInUp 0.6s ease-out",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #d1f0b1, #a3d980)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <i className={item.icon} style={{ fontSize: "1.3rem", color: "#2a5a2a" }} />
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#7ec8e3",
                  marginBottom: "0.5rem",
                }}
              >
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.5rem" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#5a6b5a", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — The Agents
          The dream team. The Avengers of travel planning.
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "linear-gradient(180deg, #f8fdf4 0%, #ffffff 100%)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem" }}>
          Meet The Agents
        </h2>
        <p style={{ color: "#5a6b5a", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Each specialist is an AI agent powered by Llama 3.3 70b, working in harmony.
        </p>
        <div
          className="flex justify-content-center flex-wrap gap-4"
          style={{ maxWidth: "1100px", margin: "0 auto" }}
        >
          {AGENTS.map((agent) => (
            <div
              key={agent.name}
              style={{
                flex: "1 1 230px",
                maxWidth: "260px",
                padding: "2rem 1.5rem",
                borderRadius: "16px",
                background: "#ffffff",
                border: `2px solid ${agent.color}40`,
                boxShadow: `0 4px 20px ${agent.color}20`,
                transition: "all 0.3s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px ${agent.color}35`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${agent.color}20`;
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: agent.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  boxShadow: `0 0 20px ${agent.color}50`,
                }}
              >
                <i className={agent.icon} style={{ fontSize: "1.4rem", color: "#fff" }} />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "0.25rem" }}>
                {agent.name}
              </h3>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#7ec8e3",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {agent.role}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#5a6b5a", lineHeight: 1.5 }}>{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 4 — Tech Stack Preview
          Because nerds need to know what's under the hood.
          ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "5rem 2rem", background: "#ffffff", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "0.5rem" }}>
          Built Different
        </h2>
        <p style={{ color: "#5a6b5a", marginBottom: "2.5rem", fontSize: "1.05rem" }}>
          Enterprise-grade tech, cotton-candy aesthetics.
        </p>
        <div className="flex justify-content-center flex-wrap gap-3" style={{ maxWidth: "800px", margin: "0 auto" }}>
          {[
            { label: "Llama 3.3 70B", icon: "pi pi-bolt", bg: "#7ec8e3" },
            { label: "Pinecone", icon: "pi pi-database", bg: "#a3d980" },
            { label: "MongoDB", icon: "pi pi-server", bg: "#f7d9d9" },
            { label: "FastAPI", icon: "pi pi-code", bg: "#d1f0b1" },
            { label: "Next.js", icon: "pi pi-globe", bg: "#7ec8e3" },
            { label: "HMAC-SHA256", icon: "pi pi-shield", bg: "#a3d980" },
          ].map((tech) => (
            <div
              key={tech.label}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "10px",
                background: tech.bg,
                color: "#1a2e1a",
                fontWeight: 700,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className={tech.icon} />
              {tech.label}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 5 — CTA
          The final nudge. Make 'em click.
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "linear-gradient(135deg, #d1f0b1 0%, #e8f8d8 50%, #c4e8f5 100%)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1a2e1a", marginBottom: "1rem" }}>
          Ready to Plan Your Next Adventure?
        </h2>
        <p style={{ color: "#3a5a3a", marginBottom: "2rem", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
          Four AI agents are standing by, ready to build your perfect itinerary
          in a few minutes.
        </p>
        <Link href="/dashboard">
          <button
            style={{
              padding: "1rem 3rem",
              fontSize: "1.15rem",
              fontWeight: 700,
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              background: "#1a2e1a",
              color: "#d1f0b1",
              boxShadow: "0 4px 20px rgba(26, 46, 26, 0.2)",
              transition: "all 0.25s",
            }}
          >
            <i className="pi pi-send" style={{ marginRight: "0.6rem" }} />
            Start Planning Now
          </button>
        </Link>
      </section>

      {/* ── Footer — every app needs one, it's the law ── */}
      <footer
        style={{
          padding: "2rem",
          textAlign: "center",
          background: "#1a2e1a",
          color: "#8a9b8a",
          fontSize: "0.85rem",
        }}
      >
        <p>Apex Travel Orchestrator — Built with Interest, caffeine, and questionable CSS choices.</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
          Llama 3.3 70B via Groq | LangChain ReAct | Pinecone | Next.js | FastAPI
        </p>
      </footer>
    </main>
  );
}
