'use client';

import { motion } from 'framer-motion';

/* Static sample data — illustrative only, not real user data */
const DNA_FIELDS = [
  { label: 'Home Hub',    value: 'MAA — Chennai' },
  { label: 'Travel Pace', value: 'Moderate'       },
  { label: 'Stay Style',  value: 'Mid-Range'      },
  { label: 'Dietary',     value: 'Vegetarian'     },
  { label: 'Interests',   value: 'Culture · Food · Nature' },
];

export function PersonalizationSection() {
  return (
    <section
      id="personalization"
      className="py-24"
      style={{ background: '#F0EDE4' }}
      aria-labelledby="personal-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — animated DNA card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex justify-center lg:justify-start"
          >
            {/* Wrap in a gradient backdrop so glass reads correctly */}
            <div
              className="relative p-6 rounded-3xl"
              style={{
                background:
                  'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(30,43,92,0.08) 0%, transparent 70%)',
              }}
            >
              <div className="apex-glass rounded-2xl p-8 w-80 shadow-float">
                {/* Card header */}
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100/60">
                  <div className="w-9 h-9 rounded-xl apex-indigo-bg flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-sm text-apex-gold">A</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-apex-indigo tracking-wider uppercase">
                      Your Travel DNA
                    </p>
                    <p className="text-xs text-apex-text-tertiary">Alex M. · Premium member</p>
                  </div>
                </div>

                {/* DNA fields */}
                <div className="space-y-4">
                  {DNA_FIELDS.map((field, i) => (
                    <motion.div
                      key={field.label}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        delay:      i * 0.08,
                        type:       'spring',
                        stiffness:  400,
                        damping:    30,
                      }}
                      className="flex items-start justify-between gap-4"
                    >
                      <span className="text-xs font-apex-mono text-apex-text-tertiary uppercase tracking-wider whitespace-nowrap">
                        {field.label}
                      </span>
                      <span className="text-sm font-medium text-apex-text-primary text-right">
                        {field.value}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Checkmark badge */}
                <div className="mt-6 pt-5 border-t border-slate-100/60">
                  <div className="flex items-center gap-2 text-apex-success">
                    <i className="pi pi-check-circle text-sm" aria-hidden="true" />
                    <span className="text-xs font-medium">Profile complete</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          >
            <p className="text-xs font-semibold text-apex-gold tracking-[0.2em] uppercase mb-5">
              Personalization
            </p>
            <h2
              id="personal-heading"
              className="font-display text-3xl md:text-4xl text-apex-text-primary mb-6 leading-tight"
            >
              Your DNA.<br />
              Every trip.
            </h2>
            <p className="text-apex-text-secondary leading-relaxed mb-6">
              Before Apex plans anything, it reads your travel profile — your home airport,
              dietary restrictions, pace preference, and interests. Every recommendation
              flows from who you are, not from generic popularity.
            </p>
            <p className="text-apex-text-secondary leading-relaxed mb-8">
              As you plan more trips, your profile deepens. Past destinations inform future
              ones. Preferences you set once are remembered forever.
            </p>

            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-apex-indigo hover:text-apex-indigo-mid transition-colors group"
            >
              Build your profile
              <i
                className="pi pi-arrow-right text-xs transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
