import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/about',     label: 'About'       },
  { href: '/dashboard', label: 'Plan a Trip' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-apex-paper py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md apex-indigo-bg flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-xs text-apex-gold leading-none select-none">
              A
            </span>
          </div>
          <span className="text-sm font-medium text-apex-text-secondary">
            Apex Travel Orchestrator
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6" aria-label="Footer navigation">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-apex-text-tertiary hover:text-apex-text-secondary transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Tagline */}
        <p className="text-xs text-apex-text-tertiary font-apex-mono tracking-wide">
          Built with AI. Powered by you.
        </p>
      </div>
    </footer>
  );
}
