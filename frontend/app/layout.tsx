import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';

import 'primeicons/primeicons.css';
import './globals.css';

import Navbar            from '@/components/layout/Navbar';
import { Footer }         from '@/components/layout/Footer';
import { ToastProvider }  from '@/components/ToastProvider';
import { PageTransition } from '@/components/layout/PageTransition';

/* ── Fonts (self-hosted by Next.js at build time) ────────────────────────────
   CSS variables are set on <html> and referenced in globals.css @theme.
   font-display: 'optional' prevents layout shift — text renders in fallback
   immediately, switches to loaded font without reflow if it arrives in time.
─────────────────────────────────────────────────────────────────────────── */
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'optional',
});

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  weight:   ['400', '600', '700'],
  display:  'optional',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains',
  weight:   ['400'],
  display:  'optional',
});

/* ── Metadata ─────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'Apex — AI Travel Concierge',
    template: '%s | Apex',
  },
  description:
    'Apex plans your journey with your history, preferences, and lifestyle built in — not filled in. Powered by multi-agent AI.',
  keywords: ['travel planning', 'AI travel', 'itinerary', 'travel concierge'],
  openGraph: {
    title:       'Apex — AI Travel Concierge',
    description: 'Your intelligent travel concierge. Powered by multi-agent AI.',
    type:        'website',
  },
};

/* ── Root Layout ──────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex flex-col min-h-screen">
        {/* ── Skip-to-content — visible only on keyboard focus ─────────────
            Ensures keyboard and screen-reader users can skip the navbar.
        ──────────────────────────────────────────────────────────────────── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-5 focus:py-2.5 focus:rounded-xl focus:text-sm focus:font-semibold focus:shadow-float"
          style={{ background: '#1E2B5C', color: '#ffffff' }}
        >
          Skip to main content
        </a>

        <SessionProvider>
          <ToastProvider>
            <Navbar />
            {/* PageTransition: client component — animates on route change */}
            <PageTransition>
              {/* id="main-content" is the skip-link target */}
              <div id="main-content" tabIndex={-1} className="flex-1 flex flex-col outline-none">
                {children}
              </div>
            </PageTransition>
            <Footer />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
