'use client';

import { motion } from 'framer-motion';

const AGENTS = [
  {
    icon:  'pi-send',
    title: 'Finds your flights',
    role:  'Flight Intelligence',
    body:  'Searches routes from your home hub, checks schedules, and returns the best options for your travel class preference — economy, premium, or business.',
    accent: 'bg-apex-indigo-soft text-apex-indigo',
  },
  {
    icon:  'pi-building',
    title: 'Matches your stay tier',
    role:  'Hotel Curation',
    body:  'Filters hotels by your budget tier (budget, mid-range, or luxury) in your destination, and cross-references them against your dietary and pace needs.',
    accent: 'bg-apex-gold-soft text-apex-gold',
  },
  {
    icon:  'pi-map-marker',
    title: 'Curates your days',
    role:  'Experience Design',
    body:  "Selects attractions, restaurants, and experiences that match your specific interests — not the generic tourist trail. Culture fans get galleries. Food lovers get markets.",
    accent: 'bg-emerald-50 text-emerald-700',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-apex-paper"
      aria-labelledby="how-heading"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <p className="text-xs font-semibold text-apex-gold tracking-[0.2em] uppercase mb-4">
            How It Works
          </p>
          <h2
            id="how-heading"
            className="font-display text-3xl md:text-4xl text-apex-text-primary mb-4"
          >
            Three agents. One perfect trip.
          </h2>
          <p className="text-apex-text-secondary max-w-lg mx-auto">
            Three specialist AIs run in parallel — not sequentially — so your
            itinerary arrives faster and more cohesive than any single model could manage.
          </p>
        </motion.div>

        {/* Agent cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {AGENTS.map((agent) => (
            <motion.div key={agent.title} variants={itemVariants}>
              <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100 h-full group hover:-translate-y-0.5 transition-transform duration-300">

                {/* Icon badge */}
                <div className={`w-12 h-12 rounded-xl ${agent.accent} flex items-center justify-center mb-6`}>
                  <i className={`pi ${agent.icon} text-lg`} aria-hidden="true" />
                </div>

                {/* Role label */}
                <p className="text-xs font-semibold text-apex-text-tertiary tracking-[0.15em] uppercase mb-2">
                  {agent.role}
                </p>

                {/* Title */}
                <h3 className="text-lg font-semibold text-apex-text-primary mb-3">
                  {agent.title}
                </h3>

                {/* Body */}
                <p className="text-sm text-apex-text-secondary leading-relaxed">
                  {agent.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Connector — shows agents run in parallel */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-3 text-sm text-apex-text-tertiary"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <span className="flex items-center gap-1.5">
            <i className="pi pi-bolt text-apex-indigo text-xs" aria-hidden="true" />
            All three agents run simultaneously
          </span>
          <span className="w-1 h-1 rounded-full bg-apex-text-tertiary" />
          <span>Results synthesized into one cohesive itinerary</span>
        </motion.div>
      </div>
    </section>
  );
}
