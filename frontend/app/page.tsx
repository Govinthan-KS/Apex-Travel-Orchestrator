import type { Metadata } from 'next';
import Link from 'next/link';

import { LandingHero }            from '@/components/landing/LandingHero';
import { HowItWorksSection }      from '@/components/landing/HowItWorksSection';
import { PersonalizationSection } from '@/components/landing/PersonalizationSection';
import { SocialProofSection }     from '@/components/landing/SocialProofSection';

export const metadata: Metadata = {
  title:       'Apex — AI Travel Concierge',
  description: 'Travel that knows you. Apex plans your journey with your history, preferences, and lifestyle built in — not filled in.',
};

export default function HomePage() {
  return (
    <>
      {/* Section 1 — Hero (starts at top-0, behind transparent navbar) */}
      <LandingHero />

      {/* Section 2 — How It Works */}
      <HowItWorksSection />

      {/* Section 3 — Personalization */}
      <PersonalizationSection />

      {/* Section 4 — Differentiators */}
      <SocialProofSection />

      {/* Section 5 — Final CTA (the one dark section) ─────────────────────
          Deliberately dark to create contrast weight before the footer.
          No Framer Motion needed — CSS transitions are sufficient here.
      ─────────────────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-6 apex-indigo-bg text-center relative overflow-hidden"
        aria-labelledby="cta-heading"
      >
        {/* Subtle top highlight line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(184,134,78,0.4), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(45,63,142,0.5) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-apex-gold/80 tracking-[0.2em] uppercase mb-6">
            Ready when you are
          </p>

          <h2
            id="cta-heading"
            className="font-display text-4xl md:text-5xl text-white mb-6 leading-tight"
          >
            Ready to travel differently?
          </h2>

          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Start with your travel DNA. Let Apex handle the rest.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 px-10 py-5 bg-white text-apex-indigo font-semibold text-lg rounded-2xl hover:bg-apex-paper transition-colors shadow-heavy"
          >
            Get Started
            <i className="pi pi-arrow-right text-sm" aria-hidden="true" />
          </Link>

          <p className="mt-6 text-xs text-white/40">
            Free to use. No credit card required.
          </p>
        </div>
      </section>
    </>
  );
}
