'use client';

import { motion } from 'framer-motion';

const ARCHITECTURE = [
  {
    title: 'AI Planning Engine',
    icon: 'pi-bolt',
    items: [
      'Powered by Google Gemini for intelligent trip planning and orchestration',
      'Three specialist agents - Flights, Hotels, Experiences - run simultaneously',
      'Parallel execution delivers a complete itinerary in seconds, not minutes',
      'Your Travel DNA is injected into every prompt for deeply personal results',
    ],
  },
  {
    title: 'Pinecone Vector DB',
    icon: 'pi-database',
    items: [
      '384-dimension cosine similarity index for semantic memory',
      'Per-user namespace isolation - your preferences stay yours',
      'Local embeddings via all-MiniLM-L6-v2 (~90ms per encode)',
      'Semantic memory retrieval surfaces past trips into new plans',
    ],
  },
  {
    title: 'MongoDB + NextAuth',
    icon: 'pi-server',
    items: [
      'Travel DNA: surveys + frequencyweights collections',
      'Google OAuth via NextAuth with JWT session management',
      'Hard constraints: dietary, home hub, accessibility, pace',
      'Soft preferences: flight class, stay tier, interest weights',
    ],
  },
  {
    title: 'HMAC-SHA256 Security',
    icon: 'pi-shield',
    items: [
      'Frontend signs Travel DNA payload with a shared secret',
      'Backend verifies X-Apex-Signature header before every AI call',
      'Deterministic JSON serialization across Node.js and Python',
      '403 Forbidden on signature mismatch - protects API credits',
    ],
  },
];

const DATA_FLOW = [
  'User signs in via Google OAuth',
  'Onboarding wizard saves Travel DNA to MongoDB',
  'Preferences are vectorized and stored in Pinecone',
  'Dashboard fetches DNA + signs it with HMAC-SHA256',
  'Python backend verifies signature, Gemini coordinator parses query and plans',
  'Coordinator delegates to Flight, Hotel, and Attraction agents',
  'JSON itinerary rendered as an animated vertical timeline',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function AboutPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen apex-hero-bg pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="text-center mb-16">
          <p className="text-xs font-semibold text-apex-gold tracking-[0.2em] uppercase mb-4">
            Architecture Deep Dive
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-apex-text-primary mb-5 leading-tight">
            How Apex works.
          </h1>
          <p className="text-apex-text-secondary max-w-xl mx-auto leading-relaxed">
            A multi-agent AI system that reads your Travel DNA, remembers your preferences,
            and builds itineraries that actually match who you are.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-5 mb-16">
          {ARCHITECTURE.map((section) => (
            <motion.div key={section.title} variants={fadeUp} className="apex-glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl apex-indigo-bg flex items-center justify-center flex-shrink-0">
                  <i className={`pi ${section.icon} text-apex-gold text-sm`} aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-apex-text-primary text-base">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-apex-text-secondary leading-relaxed">
                    <i className="pi pi-check text-apex-indigo text-xs mt-1 flex-shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
          <h2 className="font-display text-2xl text-apex-text-primary text-center mb-10">
            End-to-end data flow.
          </h2>
          <div className="max-w-xl mx-auto relative">
            <div
              className="absolute left-[17px] top-3 bottom-3 w-px"
              style={{ background: 'linear-gradient(to bottom, #1E2B5C, rgba(30,43,92,0.1))' }}
              aria-hidden="true"
            />
            <ol className="space-y-6">
              {DATA_FLOW.map((label, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const }}
                  className="flex items-start gap-4 relative"
                >
                  <div className="w-9 h-9 rounded-full apex-indigo-bg flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-xs font-bold text-apex-gold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-apex-text-secondary leading-relaxed pt-2">{label}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>

        <p className="text-center text-xs text-apex-text-tertiary mt-16">
          Built to plan smarter trips - not to replace the joy of getting lost.
        </p>
      </div>
    </main>
  );
}
