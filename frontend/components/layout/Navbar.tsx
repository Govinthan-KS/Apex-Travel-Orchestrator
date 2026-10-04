'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useApexToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';

/* Links always visible (auth + unauth) */
const SHARED_LINKS = [
  { href: '/',       label: 'Home'  },
  { href: '/about',  label: 'About' },
];

/* Links shown only when authenticated */
const AUTH_LINKS = [
  { href: '/dashboard', label: 'Plan Trip' },
  { href: '/profile',   label: 'Profile'   },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const { showSuccess } = useApexToast();
  const pathname = usePathname();

  const isLoggedIn = status === 'authenticated';
  const hasShownWelcome = useRef(false);

  const [scrolled,     setScrolled]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Scroll detection ────────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Welcome toast on first authenticated render ─────────────────────── */
  useEffect(() => {
    if (isLoggedIn && !hasShownWelcome.current && session?.user?.name) {
      const firstName = session.user.name.split(' ')[0];
      showSuccess(`Welcome back, ${firstName}.`, 'Ready to plan your next journey?');
      hasShownWelcome.current = true;
    }
  }, [isLoggedIn, session, showSuccess]);

  /* ── Close dropdown on click outside ────────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Close menus on route change ─────────────────────────────────────── */
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  /* ── Escape key ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    showSuccess('See you soon.', 'You have been signed out.');
    setTimeout(() => signOut({ callbackUrl: '/' }), 800);
  };

  const avatarInitial = session?.user?.name?.[0]?.toUpperCase() ?? 'A';

  /*
   * Navbar is glass when:
   *  - User is authenticated (content is always behind it on auth pages), OR
   *  - User has scrolled past 60px (landing page)
   *
   * Navbar is transparent when:
   *  - User is unauthenticated AND has not scrolled (landing page hero)
   */
  const isGlass = isLoggedIn || scrolled;

  return (
    <>
      {/* ── Main Navbar ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={false}
        animate={
          isGlass
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.72)',
                borderBottomColor: 'rgba(255, 255, 255, 0.45)',
              }
            : {
                backgroundColor: 'rgba(250, 249, 246, 0)',
                borderBottomColor: 'rgba(255, 255, 255, 0)',
              }
        }
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={
          isGlass
            ? {
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 24px rgba(30,43,92,0.06)',
              }
            : undefined
        }
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2 rounded-lg"
            aria-label="Apex — go to homepage"
          >
            <div className="w-8 h-8 rounded-lg apex-indigo-bg flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="font-display font-bold text-sm text-apex-gold leading-none select-none">
                A
              </span>
            </div>
            <span className="font-display font-semibold text-xl text-apex-text-primary tracking-tight">
              Apex
            </span>
          </Link>

          {/* ── Desktop nav — always visible ──────────────────────────── */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {[...SHARED_LINKS, ...(isLoggedIn ? AUTH_LINKS : [])].map(({ href, label }) => {
              const isActive =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    isActive
                      ? 'text-apex-indigo'
                      : 'text-apex-text-secondary hover:text-apex-text-primary hover:bg-apex-indigo-soft/50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-apex-indigo rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right side ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Avatar + dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center',
                      'text-white text-sm font-semibold overflow-hidden',
                      'bg-apex-indigo hover:bg-apex-indigo-mid transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2'
                    )}
                    aria-label={`Open user menu for ${session?.user?.name ?? 'user'}`}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                  >
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? 'Profile picture'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 top-full mt-2 w-56 apex-glass rounded-xl overflow-hidden shadow-float"
                        role="menu"
                        aria-label="User menu"
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-slate-100/60">
                          <p className="text-sm font-semibold text-apex-text-primary truncate">
                            {session?.user?.name}
                          </p>
                          <p className="text-xs text-apex-text-tertiary truncate">
                            {session?.user?.email}
                          </p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-apex-text-secondary hover:bg-apex-indigo-soft/50 hover:text-apex-indigo transition-colors"
                          >
                            <i className="pi pi-user text-xs" aria-hidden="true" />
                            My Profile
                          </Link>
                          <Link
                            href="/dashboard"
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-apex-text-secondary hover:bg-apex-indigo-soft/50 hover:text-apex-indigo transition-colors"
                          >
                            <i className="pi pi-map text-xs" aria-hidden="true" />
                            Plan a Trip
                          </Link>
                        </div>

                        {/* Sign out */}
                        <div className="border-t border-slate-100/60 py-1">
                          <button
                            role="menuitem"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-apex-error hover:bg-red-50/60 transition-colors"
                          >
                            <i className="pi pi-sign-out text-xs" aria-hidden="true" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile hamburger (authenticated only) */}
                <button
                  onClick={() => setMobileOpen((p) => !p)}
                  className={cn(
                    'md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
                    'hover:bg-apex-indigo-soft/50',
                    'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2'
                  )}
                  aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                >
                  <span className="flex flex-col gap-1.5 w-5" aria-hidden="true">
                    <motion.span
                      animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="block h-0.5 bg-apex-text-primary rounded-full origin-center"
                    />
                    <motion.span
                      animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.15 }}
                      className="block h-0.5 bg-apex-text-primary rounded-full"
                    />
                    <motion.span
                      animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="block h-0.5 bg-apex-text-primary rounded-full origin-center"
                    />
                  </span>
                </button>
              </>
            ) : (
              /* Unauthenticated: Sign In link styled as ghost button */
              <Link
                href="/login"
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'text-apex-indigo hover:bg-apex-indigo-soft transition-colors duration-200',
                  'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2'
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile menu overlay (authenticated only) ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && isLoggedIn && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Navigation menu"
          >
            {/* Backdrop — click to close */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(30,43,92,0.08)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="absolute right-0 top-0 bottom-0 w-72 apex-glass pt-20 px-6 pb-8 flex flex-col"
            >
              {/* User info */}
              <div className="mb-6 pb-4 border-b border-slate-200/60">
                <p className="text-sm font-semibold text-apex-text-primary">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-apex-text-tertiary truncate">
                  {session?.user?.email}
                </p>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-1 flex-1">
                {[...SHARED_LINKS, ...AUTH_LINKS].map(({ href, label }, i) => {
                  const isActive = href === '/' ? pathname === '/' : pathname === href;
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.05,
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    >
                      <Link
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'block px-4 py-3 rounded-xl text-base font-medium transition-colors',
                          isActive
                            ? 'bg-apex-indigo-soft text-apex-indigo'
                            : 'text-apex-text-secondary hover:bg-apex-indigo-soft/50 hover:text-apex-indigo'
                        )}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Sign out */}
              <div className="pt-4 border-t border-slate-200/60">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-medium text-apex-error hover:bg-red-50/60 transition-colors"
                >
                  <i className="pi pi-sign-out text-sm" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
