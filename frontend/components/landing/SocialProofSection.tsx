'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui';

const DIFFERENTIATORS = [
  {
    icon: 'pi-compass',
    title: 'Not a search engine',
    body: 'No prices, no booking links, no noise. Apex focuses entirely on intelligent planning — giving you the complete itinerary framework to execute however you choose.',
  },
  {
    icon: 'pi-database',
    title: 'Memory-powered',
    body: 'Every trip you plan updates your profile. Apex learns your patterns — what you loved, what you skipped — and applies that to the next itinerary.',
  },
  {
    icon: 'pi-sitemap',
    title: 'Parallel intelligence',
    body: 'Three specialist AI agents run simultaneously — flights, hotels, and attractions — instead of sequentially. Your itinerary arrives faster and more cohesive.',
  },
  {
    icon: 'pi-lock',
    title: 'Yours alone',
    body: "Your travel DNA, your history, your preferences. Every user's experience is fully isolated — Apex never blends your data with anyone else's.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

export function SocialProofSection() {
  return (
    <section
      id="differentiators"
      className="py-24 bg-apex-paper"
      aria-labelledby="diff-heading"
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
            Why Apex
          </p>
          <h2
            id="diff-heading"
            className="font-display text-3xl md:text-4xl text-apex-text-primary mb-4"
          >
            Different by design.
          </h2>
          <p className="text-apex-text-secondary max-w-lg mx-auto">
            Built around how people actually travel — not how booking platforms want you to.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {DIFFERENTIATORS.map((item) => (
            <motion.div key={item.title} variants={itemVariants}>
              <Card variant="solid" padding="lg" className="h-full">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-apex-indigo-soft flex items-center justify-center mt-0.5">
                    <i className={`pi ${item.icon} text-sm text-apex-indigo`} aria-hidden="true" />
                  </div>
                  {/* Text */}
                  <div>
                    <h3 className="text-base font-semibold text-apex-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-apex-text-secondary leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
