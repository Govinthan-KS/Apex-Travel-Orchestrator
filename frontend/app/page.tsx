"use client";

import Link from "next/link";

const AGENTS = [
  {
    name: "The Coordinator",
    role: "Strategic Orchestrator",
    icon: "pi pi-sitemap",
    desc: "The mastermind who reads your DNA, fetches your memories, and delegates tasks to the specialists with military precision.",
    color: "bg-lime-400",
    text: "text-slate-950",
    shadow: "shadow-[0_0_15px_rgba(163,230,53,0.2)]"
  },
  {
    name: "Flight Specialist",
    role: "Sky Navigator",
    icon: "pi pi-send",
    desc: "Finds the perfect flights from your Home Hub. Knows every IATA code by heart and never defaults to Delhi anymore.",
    color: "bg-slate-800",
    text: "text-slate-200",
    shadow: "shadow-none"
  },
  {
    name: "Hotel Specialist",
    role: "Tier-Based Curator",
    icon: "pi pi-building",
    desc: "Judges your budget, respects your tier preference, and won't let you stay in a 2-star if you said Luxury.",
    color: "bg-slate-800",
    text: "text-slate-200",
    shadow: "shadow-none"
  },
  {
    name: "Attraction Specialist",
    role: "Interest Curator",
    icon: "pi pi-map-marker",
    desc: "Curates landmarks based on YOUR interests. Love food? Expect 2+ markets minimum. Love nightlife? We approve.",
    color: "bg-slate-800",
    text: "text-slate-200",
    shadow: "shadow-none"
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
    <main className="overflow-hidden bg-slate-950 text-slate-200">
      {/* ── SECTION 1: Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-6 overflow-hidden border-b border-slate-900">
        {/* Cyber Blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-lime-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-lime-400/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-lime-400 text-xs font-bold tracking-wider mb-6 shadow-sm">
            POWERED BY LLAMA 3.3 70B + MULTI-AGENT ORCHESTRATION
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent">
            Your Travel Plans,<br />
            AI-Orchestrated
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Four AI specialists work together to build personalized itineraries
            that honor your dietary needs, travel pace, and budget — not just
            the most Instagrammable spots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl font-bold bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-[0_0_25px_rgba(163,230,53,0.2)] hover:shadow-[0_0_35px_rgba(163,230,53,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <i className="pi pi-send" />
              Plan Your Trip
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-xl font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center justify-center"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: How It Works ── */}
      <section className="py-24 px-6 bg-slate-950 text-center border-b border-slate-900">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-4 tracking-tight">How It Works</h2>
        <p className="text-slate-500 text-lg mb-16 max-w-xl mx-auto">Four steps to your dream trip. No spreadsheets required.</p>
        
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex-1 min-w-[240px] max-w-[280px] p-8 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-lime-500/30 transition-all group relative overflow-hidden">
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-6 text-lime-400 group-hover:scale-110 group-hover:bg-slate-700 transition-all">
                <i className={`${item.icon} text-2xl`} />
              </div>
              <div className="text-xs font-black text-slate-600 mb-2 tracking-widest uppercase">STEP {item.step}</div>
              <h3 className="text-xl font-bold text-slate-200 mb-3">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: The Agents ── */}
      <section className="py-24 px-6 bg-slate-950/50 text-center border-b border-slate-900">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent mb-4 tracking-tight">Meet The Agents</h2>
        <p className="text-slate-500 text-lg mb-16 max-w-xl mx-auto">Each specialist is an AI agent powered by Llama 3.3 70b, working in harmony.</p>
        
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="flex-1 min-w-[260px] max-w-[300px] p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-16 h-16 rounded-2xl ${agent.color} ${agent.text} flex items-center justify-center mx-auto mb-6 ${agent.shadow}`}>
                <i className={`${agent.icon} text-2xl`} />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-1">{agent.name}</h3>
              <div className="text-xs font-bold text-lime-400 mb-4 uppercase tracking-widest">{agent.role}</div>
              <p className="text-slate-400 text-sm leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: CTA ── */}
      <section className="py-24 px-6 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-lime-400/50 to-transparent" />
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">Ready to Plan Your Next Adventure?</h2>
        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-medium">
          Four AI agents are standing by, ready to build your perfect itinerary in a few minutes.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-xl font-bold bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)]"
        >
          <i className="pi pi-bolt" />
          Start Planning Now
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center bg-slate-950 text-slate-600 text-sm border-t border-slate-900">
        <p className="mb-2 font-medium">Apex Travel Orchestrator — Built with AI and Cyber Lime aesthetics.</p>
        <p className="text-xs text-slate-700">Llama 3.3 70B via Groq | LangChain ReAct | Pinecone | Next.js 15 | FastAPI</p>
      </footer>
    </main>
  );
}
