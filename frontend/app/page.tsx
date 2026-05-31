"use client";

import Link from "next/link";

const AGENTS = [
  {
    name: "The Coordinator",
    role: "Strategic Orchestrator",
    icon: "pi pi-sitemap",
    desc: "The mastermind who reads your DNA, fetches your memories, and delegates tasks to the specialists with military precision.",
    color: "bg-indigo-600",
    shadow: "shadow-indigo-200"
  },
  {
    name: "Flight Specialist",
    role: "Sky Navigator",
    icon: "pi pi-send",
    desc: "Finds the perfect flights from your Home Hub. Knows every IATA code by heart and never defaults to Delhi anymore.",
    color: "bg-emerald-500",
    shadow: "shadow-emerald-200"
  },
  {
    name: "Hotel Specialist",
    role: "Tier-Based Curator",
    icon: "pi pi-building",
    desc: "Judges your budget, respects your tier preference, and won't let you stay in a 2-star if you said Luxury.",
    color: "bg-rose-500",
    shadow: "shadow-rose-200"
  },
  {
    name: "Attraction Specialist",
    role: "Interest Curator",
    icon: "pi pi-map-marker",
    desc: "Curates landmarks based on YOUR interests. Love food? Expect 2+ markets minimum. Love nightlife? We approve.",
    color: "bg-amber-500",
    shadow: "shadow-amber-200"
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
    <main className="overflow-hidden bg-slate-50">
      {/* ── SECTION 1: Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-indigo-100 blur-3xl opacity-60 animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-100 blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wider mb-6 border border-indigo-100 shadow-sm">
            POWERED BY LLAMA 3.3 70B + MULTI-AGENT ORCHESTRATION
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Your Travel Plans,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              AI-Orchestrated
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Four AI specialists work together to build personalized itineraries
            that honor your dietary needs, travel pace, and budget — not just
            the most Instagrammable spots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <i className="pi pi-send" />
              Plan Your Trip
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: How It Works ── */}
      <section className="py-24 px-6 bg-white text-center border-t border-slate-100">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How It Works</h2>
        <p className="text-slate-500 text-lg mb-16 max-w-xl mx-auto">Four steps to your dream trip. No spreadsheets required.</p>
        
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex-1 min-w-[240px] max-w-[280px] p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                <i className={`${item.icon} text-2xl`} />
              </div>
              <div className="text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">STEP {item.step}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: The Agents ── */}
      <section className="py-24 px-6 bg-slate-50 text-center border-t border-slate-100">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Meet The Agents</h2>
        <p className="text-slate-500 text-lg mb-16 max-w-xl mx-auto">Each specialist is an AI agent powered by Llama 3.3 70b, working in harmony.</p>
        
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {AGENTS.map((agent) => (
            <div key={agent.name} className={`flex-1 min-w-[260px] max-w-[300px] p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-16 h-16 rounded-full ${agent.color} text-white flex items-center justify-center mx-auto mb-6 shadow-lg ${agent.shadow}`}>
                <i className={`${agent.icon} text-2xl`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{agent.name}</h3>
              <div className="text-xs font-bold text-indigo-600 mb-4 uppercase tracking-widest">{agent.role}</div>
              <p className="text-slate-500 text-sm leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: Tech Stack ── */}
      <section className="py-24 px-6 bg-white text-center border-t border-slate-100">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Built Different</h2>
        <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto">Enterprise-grade tech, minimalist aesthetics.</p>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {[
            { label: "Llama 3.3 70B", icon: "pi pi-bolt" },
            { label: "Pinecone", icon: "pi pi-database" },
            { label: "MongoDB", icon: "pi pi-server" },
            { label: "FastAPI", icon: "pi pi-code" },
            { label: "Next.js", icon: "pi pi-globe" },
            { label: "Tailwind CSS", icon: "pi pi-palette" },
          ].map((tech) => (
            <div key={tech.label} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center gap-2 border border-slate-200">
              <i className={`${tech.icon} text-slate-400`} />
              {tech.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: CTA ── */}
      <section className="py-24 px-6 bg-indigo-600 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to Plan Your Next Adventure?</h2>
        <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto font-medium">
          Four AI agents are standing by, ready to build your perfect itinerary in a few minutes.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold bg-white text-indigo-600 hover:bg-slate-50 hover:scale-105 transition-all shadow-xl shadow-indigo-900/20"
        >
          <i className="pi pi-send" />
          Start Planning Now
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center bg-slate-900 text-slate-400 text-sm">
        <p className="mb-2 font-medium">Apex Travel Orchestrator — Built with AI, caffeine, and Tailwind CSS.</p>
        <p className="text-xs text-slate-500">Llama 3.3 70B via Groq | LangChain ReAct | Pinecone | Next.js 15 | FastAPI</p>
      </footer>
    </main>
  );
}
