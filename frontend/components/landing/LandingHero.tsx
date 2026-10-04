'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';

/* Animated globe canvas — SSR disabled, only loads on landing page */
const GlobeCanvas = dynamic(
  () => import('./GlobeCanvas').then((m) => m.GlobeCanvas),
  {
    ssr:     false,
    loading: () => <div className="w-full h-full" aria-hidden="true" />,
  }
);

/* Hero stats — right panel, below the particle sphere */
const STATS = [
  { value: '3',    label: 'AI Agents'   },
  { value: 'DNA',  label: 'Your profile' },
  { value: '~20s', label: 'To plan'     },
];

/* Text items that stagger in on mount */
const heroItems = [
  { delay: 0   },
  { delay: 0.06 },
  { delay: 0.12 },
  { delay: 0.18 },
  { delay: 0.24 },
];

export function LandingHero() {
  return (
    <section
      className="relative min-h-screen apex-hero-bg flex items-center overflow-hidden"
      aria-labelledby="hero-headline"
    >
      {/* Max-width container, pt-16 clears the fixed navbar */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-16 pb-16">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center">

          {/* ── Left: Text content ───────────────────────────────────────── */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: heroItems[0].delay, type: 'spring', stiffness: 400, damping: 30 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-apex-gold-soft border border-apex-gold/20 text-apex-gold text-xs font-semibold tracking-[0.15em] uppercase mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-apex-gold flex-shrink-0" aria-hidden="true" />
                AI Travel Concierge
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: heroItems[1].delay, type: 'spring', stiffness: 400, damping: 30 }}
              className="font-display text-5xl md:text-6xl lg:text-[4.5rem] text-apex-text-primary leading-[1.1] tracking-tight mb-6"
            >
              Travel that<br />
              <span className="text-apex-indigo">knows you.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: heroItems[2].delay, type: 'spring', stiffness: 400, damping: 30 }}
              className="text-lg text-apex-text-secondary max-w-xl leading-relaxed mb-10"
            >
              Apex plans your journey with your history, preferences, and lifestyle
              built in — not filled in every time. Your intelligent travel concierge,
              ready when you are.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: heroItems[3].delay, type: 'spring', stiffness: 400, damping: 30 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-apex-gold text-white font-semibold text-base rounded-2xl hover:opacity-90 transition-opacity shadow-[0_4px_16px_rgba(184,134,78,0.3)]"
              >
                Start Planning
                <i className="pi pi-arrow-right text-sm" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-apex-indigo font-medium text-base rounded-2xl hover:bg-apex-indigo-soft transition-colors"
              >
                See how it works
                <i className="pi pi-angle-down text-sm" aria-hidden="true" />
              </a>
            </motion.div>

            {/* Social signal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: heroItems[4].delay }}
              className="text-xs text-apex-text-tertiary"
            >
              No credit card. No booking. Pure planning intelligence.
            </motion.p>
          </div>

          {/* ── Right: Particle canvas + stats ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-8"
          >
            {/* Canvas container */}
            <div className="relative w-full">
              {/* Soft ambient glow behind canvas */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(30,43,92,0.07) 0%, transparent 70%)',
                }}
                aria-hidden="true"
              />

              {/* Globe canvas — desktop only, square container */}
              <div className="hidden lg:flex lg:items-center lg:justify-center h-[400px] w-full" aria-hidden="true">
                <div className="w-[400px] h-[400px]">
                  <GlobeCanvas />
                </div>
              </div>

              {/* CSS ambient rings — mobile fallback / always rendered behind canvas */}
              <div className="lg:hidden flex items-center justify-center py-8" aria-hidden="true">
                <div className="relative w-56 h-56">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-apex-indigo/10"
                      style={{
                        inset:   `${i * 18}px`,
                        opacity: 1 - i * 0.25,
                      }}
                    />
                  ))}
                  {/* Logo mark in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl apex-indigo-bg flex items-center justify-center shadow-float">
                      <span className="font-display font-bold text-2xl text-apex-gold">A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-stats */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="font-apex-mono text-xl font-bold text-apex-indigo leading-none mb-1">
                    {value}
                  </p>
                  <p className="text-xs text-apex-text-tertiary">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        aria-hidden="true"
      >
        <span className="text-xs text-apex-text-tertiary">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <i className="pi pi-angle-down text-apex-text-tertiary text-sm" />
        </motion.div>
      </motion.div>
    </section>
  );
}
