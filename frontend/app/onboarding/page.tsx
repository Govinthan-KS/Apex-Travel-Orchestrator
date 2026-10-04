'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { submitOnboarding } from './actions';
import type { OnboardingData } from './actions';
import { useApexToast } from '@/components/ToastProvider';
import { Stepper, Tag, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { HOME_CITIES, getCityName } from '@/lib/constants';

/* ─────────────────────────────────────────────────────────────────────────────
   Option data — stripped of emoji (display-only labels for premium feel)
───────────────────────────────────────────────────────────────────────────── */

const PACE_OPTIONS = [
  { value: 'relaxed',   label: 'Relaxed',   icon: 'pi-clock',    desc: 'Two or three sights per day. Space to breathe.' },
  { value: 'moderate',  label: 'Moderate',  icon: 'pi-compass',  desc: 'A full day without feeling rushed.' },
  { value: 'intensive', label: 'Intensive', icon: 'pi-bolt',     desc: 'Every hour planned. Maximum ground covered.' },
];

const STAY_OPTIONS = [
  { value: 'budget',    label: 'Budget',    icon: 'pi-wallet',   desc: 'Hostels and guesthouses. Clean and functional.' },
  { value: 'mid_range', label: 'Mid-Range', icon: 'pi-building', desc: '3-star hotels with good central locations.' },
  { value: 'luxury',    label: 'Luxury',    icon: 'pi-star',     desc: 'Premium hotels, suites, or boutique stays.' },
  { value: 'resort',    label: 'Resort',    icon: 'pi-sun',      desc: 'Resort experience with amenities included.' },
];

const FLIGHT_CLASS_OPTIONS = [
  { value: 'economy',         label: 'Economy',       icon: 'pi-send',       desc: 'Standard seating.' },
  { value: 'premium_economy', label: 'Premium Eco',   icon: 'pi-send',       desc: 'Extra legroom + perks.' },
  { value: 'business',        label: 'Business',      icon: 'pi-briefcase',  desc: 'Lie-flat beds on long-haul.' },
  { value: 'first',           label: 'First Class',   icon: 'pi-crown',      desc: 'Suite-level luxury.' },
];

const DIETARY_OPTIONS = [
  { value: 'none',         label: 'No restrictions' },
  { value: 'vegetarian',   label: 'Vegetarian'      },
  { value: 'vegan',        label: 'Vegan'           },
  { value: 'halal',        label: 'Halal'           },
  { value: 'kosher',       label: 'Kosher'          },
  { value: 'gluten-free',  label: 'Gluten-Free'     },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'none',             label: 'None needed'    },
  { value: 'wheelchair',       label: 'Wheelchair'     },
  { value: 'visual_aid',       label: 'Visual Aid'     },
  { value: 'hearing_aid',      label: 'Hearing Aid'    },
  { value: 'mobility_support', label: 'Mobility'       },
];

const INTEREST_OPTIONS = [
  { value: 'culture',      label: 'Culture'     },
  { value: 'adventure',    label: 'Adventure'   },
  { value: 'food',         label: 'Food'        },
  { value: 'nightlife',    label: 'Nightlife'   },
  { value: 'nature',       label: 'Nature'      },
  { value: 'shopping',     label: 'Shopping'    },
  { value: 'relaxation',   label: 'Relaxation'  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Step metadata
───────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { title: 'Where do you fly from?',    subtitle: 'Select your home city from the list.' },
  { title: 'How do you like to travel?', subtitle: 'Your default pace when exploring.' },
  { title: "What's your stay style?",    subtitle: 'Your preferred accommodation tier.' },
  { title: 'What do you love doing?',    subtitle: 'Pick everything that fits you.'   },
  { title: 'A few last details.',        subtitle: 'Diet, flight class, and accessibility.' },
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   Animation variants — directional slide per step navigation
───────────────────────────────────────────────────────────────────────────── */

const stepVariants: Variants = {
  enter:  (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: {
    x: 0, opacity: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
  },
  exit:   (dir: number) => ({
    x: dir * -48, opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
};

/* ─────────────────────────────────────────────────────────────────────────────
   Local components (tightly coupled to this page's option shape)
───────────────────────────────────────────────────────────────────────────── */

function OptionCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-4 border-2 transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
        selected
          ? 'border-apex-indigo bg-apex-indigo-soft'
          : 'border-slate-200 bg-white hover:border-apex-indigo/30 hover:bg-apex-indigo-soft/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon badge */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            selected ? 'bg-apex-indigo' : 'bg-slate-100'
          )}
        >
          <i
            className={cn('pi', icon, 'text-sm', selected ? 'text-white' : 'text-apex-text-tertiary')}
            aria-hidden="true"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', selected ? 'text-apex-indigo' : 'text-apex-text-primary')}>
            {title}
          </p>
          <p className="text-xs text-apex-text-tertiary mt-0.5 leading-snug">{desc}</p>
        </div>

        {/* Selected checkmark */}
        {selected && (
          <i className="pi pi-check-circle text-apex-indigo text-sm mt-0.5 flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CityPicker — searchable dropdown for home city selection
───────────────────────────────────────────────────────────────────────────── */

type CityRow = { code: string; name: string; country: string };
const CITY_LIST = HOME_CITIES as readonly CityRow[];

function CityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  /* Focus search when dropdown opens */
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = CITY_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.country.toLowerCase().includes(query.toLowerCase())
  );

  const selected = CITY_LIST.find((c) => c.code === value);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        id="city-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full h-12 px-4 border rounded-xl text-left flex items-center justify-between bg-white',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
          open ? 'border-apex-indigo' : 'border-slate-200 hover:border-apex-indigo/40'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <i className="pi pi-map-marker text-apex-text-tertiary text-sm flex-shrink-0" aria-hidden="true" />
          {selected ? (
            <span className="text-sm text-apex-text-primary font-medium truncate">
              {selected.name}
              <span className="ml-2 text-xs text-apex-text-tertiary font-normal">{selected.code}</span>
            </span>
          ) : (
            <span className="text-sm text-apex-text-tertiary">Select your city…</span>
          )}
        </div>
        <i
          className={cn(
            'pi pi-chevron-down text-xs text-apex-text-tertiary flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          role="listbox"
          aria-label="Select home city"
          className="absolute z-30 w-full mt-1.5 bg-white rounded-xl shadow-float border border-slate-100 overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus-within:border-apex-indigo transition-colors">
              <i className="pi pi-search text-xs text-apex-text-tertiary" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search city or IATA code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-apex-text-primary placeholder:text-apex-text-tertiary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-apex-text-tertiary hover:text-apex-text-secondary"
                  aria-label="Clear search"
                >
                  <i className="pi pi-times text-[10px]" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-apex-text-tertiary text-center">No cities found</p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city.code}
                  type="button"
                  role="option"
                  aria-selected={city.code === value}
                  onClick={() => { onChange(city.code); setOpen(false); setQuery(''); }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors duration-100',
                    city.code === value
                      ? 'bg-apex-indigo-soft text-apex-indigo'
                      : 'hover:bg-slate-50 text-apex-text-primary'
                  )}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{city.name}</span>
                    <span className="ml-1.5 text-xs text-apex-text-tertiary">{city.country}</span>
                  </div>
                  <span className="text-xs text-apex-text-tertiary flex-shrink-0 ml-4 font-mono">
                    {city.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DNA Preview Card (left panel — dark indigo background variant)
───────────────────────────────────────────────────────────────────────────── */

function DNAPreviewCard({
  step,
  homeHub,
  travelPace,
  stayTier,
  interests,
  dietary,
  flightClass,
}: {
  step: number;
  homeHub: string;
  travelPace: string;
  stayTier: string;
  interests: string[];
  dietary: string;
  flightClass: string;
}) {
  const getLabel = (
    options: { label: string; value: string }[],
    value: string
  ) => options.find((o) => o.value === value)?.label ?? value;

  const fields = [
    {
      label:   'Home Hub',
      value:   homeHub ? getCityName(homeHub) : '—',
      done:    !!homeHub,
      forStep: 0,
    },
    {
      label:   'Travel Pace',
      value:   getLabel(PACE_OPTIONS, travelPace),
      done:    step > 1,
      forStep: 1,
    },
    {
      label:   'Stay Style',
      value:   getLabel(STAY_OPTIONS, stayTier),
      done:    step > 2,
      forStep: 2,
    },
    {
      label:   'Interests',
      value:   interests.length
        ? interests.map((i) => getLabel(INTEREST_OPTIONS, i)).join(', ')
        : '—',
      done:    step > 3 && interests.length > 0,
      forStep: 3,
    },
    {
      label:   'Dietary',
      value:   getLabel(DIETARY_OPTIONS, dietary),
      done:    step > 4,
      forStep: 4,
    },
    {
      label:   'Flight Class',
      value:   getLabel(FLIGHT_CLASS_OPTIONS, flightClass),
      done:    step > 4,
      forStep: 4,
    },
  ];

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.07)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-8 h-8 rounded-lg apex-indigo-bg flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-sm text-apex-gold">A</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/90 tracking-wider uppercase">
            Travel DNA
          </p>
          <p className="text-xs text-white/40">Live preview</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {fields.map((field) => {
          const isCurrent = field.forStep === step;
          return (
            <motion.div
              key={field.label}
              className="flex items-start justify-between gap-3"
              animate={{ opacity: field.forStep > step ? 0.35 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {field.done && (
                  <i className="pi pi-check text-emerald-400" style={{ fontSize: '10px' }} aria-hidden="true" />
                )}
                {isCurrent && !field.done && (
                  <div className="w-1.5 h-1.5 rounded-full bg-apex-gold flex-shrink-0 apex-pulse-dot" aria-hidden="true" />
                )}
                {!field.done && !isCurrent && (
                  <div className="w-2 flex-shrink-0" aria-hidden="true" />
                )}
                <span
                  className="text-xs font-apex-mono uppercase tracking-wider truncate"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {field.label}
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-medium text-right truncate max-w-[55%]',
                  field.value === '—' ? 'text-white/25' : 'text-white/90'
                )}
              >
                {field.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router                     = useRouter();
  const { update: updateSession }  = useSession();
  const { showSuccess, showError, showWarn } = useApexToast();

  const [step,      setStep]      = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [loading,   setLoading]   = useState(false);

  /* ── Step 0: Home Hub ─────────────────────────── */
  const [homeHub, setHomeHub] = useState('');

  /* ── Step 1: Travel Pace ─────────────────────── */
  const [travelPace, setTravelPace] = useState('moderate');

  /* ── Step 2: Stay Style ──────────────────────── */
  const [stayTier, setStayTier] = useState('mid_range');

  /* ── Step 3: Interests ───────────────────────── */
  const [interests, setInterests] = useState<string[]>([]);

  /* ── Step 4: Details ─────────────────────────── */
  const [dietary,       setDietary]       = useState('none');
  const [flightClass,   setFlightClass]   = useState('economy');
  const [accessibility, setAccessibility] = useState<string[]>([]);

  /* ── Navigation ──────────────────────────────── */
  const canProceed = step !== 0 || homeHub.trim().length > 0;

  const goNext = useCallback(() => {
    if (step === 0 && !homeHub.trim()) {
      showWarn('Home Hub required', 'Please select your home city to continue.');
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, homeHub, showWarn]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const toggleInterest = useCallback((value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const toggleAccessibility = useCallback((value: string) => {
    if (value === 'none') {
      setAccessibility(['none']);
      return;
    }
    setAccessibility((prev) => {
      const withoutNone = prev.filter((v) => v !== 'none');
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  }, []);

  /* ── Submit ──────────────────────────────────── */
  const handleSubmit = async () => {
    if (!homeHub.trim()) {
      showWarn('Home Hub required', 'Please go back and select your home city.');
      return;
    }

    setLoading(true);
    try {
      const data: OnboardingData = {
        dietary,
        homeHub:       homeHub.trim().toUpperCase(),
        accessibility: accessibility.filter((a) => a !== 'none'),
        travelPace,
        flightClass,
        stayTier,
        interests,
      };

      const result = await submitOnboarding(data);

      if (result.success) {
        showSuccess('Profile saved.', 'Your travel DNA is ready. Taking you to the dashboard.');

        /*
         * CRITICAL: updateSession() refreshes the JWT so the jwt callback
         * re-checks surveys and clears needsOnboarding. Without this, the
         * dashboard keeps redirecting back here indefinitely.
         */
        await updateSession();

        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        showError('Could not save profile.', result.error ?? 'Please try again.');
        setLoading(false);
      }
    } catch {
      showError('Something went wrong.', 'Please check your connection and try again.');
      setLoading(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">

      {/* ── Left: DNA Preview Panel (desktop only) ──────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-[360px] xl:w-[400px] apex-indigo-bg flex-col justify-between p-10 sticky top-0 h-screen"
        aria-label="Travel DNA preview"
      >
        {/* Top: Logo + tagline */}
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-lg apex-indigo-bg border border-white/20 flex items-center justify-center">
              <span className="font-display font-bold text-sm text-apex-gold">A</span>
            </div>
            <span className="font-display font-semibold text-white text-lg">Apex</span>
          </div>

          <p className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-2">
            Building your profile
          </p>
          <h2 className="font-display text-2xl text-white mb-8 leading-snug">
            Your travel DNA<br />takes shape.
          </h2>

          {/* Live DNA preview */}
          <DNAPreviewCard
            step={step}
            homeHub={homeHub}
            travelPace={travelPace}
            stayTier={stayTier}
            interests={interests}
            dietary={dietary}
            flightClass={flightClass}
          />
        </div>

        {/* Bottom: privacy note */}
        <p className="text-xs text-white/30 leading-relaxed">
          Your travel DNA is private and used only to personalise your itineraries.
          You can update it at any time from your profile.
        </p>
      </aside>

      {/* ── Right: Form Panel ───────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center min-h-screen pt-20 pb-12 px-6 apex-hero-bg">
        <div className="w-full max-w-lg">

          {/* Stepper */}
          <Stepper total={STEPS.length} current={step} className="mb-8" />

          {/* Step card */}
          <div className="bg-white rounded-2xl shadow-float overflow-hidden">

            {/* Step header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`header-${step}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <h1 className="font-display text-2xl text-apex-text-primary mb-1">
                    {STEPS[step].title}
                  </h1>
                  <p className="text-sm text-apex-text-secondary">
                    {STEPS[step].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step body */}
            <div className="px-8 py-6 min-h-[260px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >

                  {/* ── Step 0: Home Hub ───────────────────────────────── */}
                  {step === 0 && (
                    <div>
                      <CityPicker value={homeHub} onChange={setHomeHub} />
                      <p className="mt-3 text-xs text-apex-text-tertiary leading-relaxed">
                        Your home city is used to find the best flight routes for every trip you plan.
                      </p>
                    </div>
                  )}

                  {/* ── Step 1: Travel Pace ────────────────────────────── */}
                  {step === 1 && (
                    <div
                      className="flex flex-col gap-3"
                      role="radiogroup"
                      aria-label="Travel pace options"
                    >
                      {PACE_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          icon={opt.icon}
                          title={opt.label}
                          desc={opt.desc}
                          selected={travelPace === opt.value}
                          onClick={() => setTravelPace(opt.value)}
                        />
                      ))}
                    </div>
                  )}

                  {/* ── Step 2: Stay Style ─────────────────────────────── */}
                  {step === 2 && (
                    <div
                      className="grid grid-cols-2 gap-3"
                      role="radiogroup"
                      aria-label="Stay tier options"
                    >
                      {STAY_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          icon={opt.icon}
                          title={opt.label}
                          desc={opt.desc}
                          selected={stayTier === opt.value}
                          onClick={() => setStayTier(opt.value)}
                        />
                      ))}
                    </div>
                  )}

                  {/* ── Step 3: Interests ──────────────────────────────── */}
                  {step === 3 && (
                    <div>
                      <p className="text-xs text-apex-text-tertiary mb-4">
                        Select all that apply — these shape what Apex recommends.
                      </p>
                      <div
                        className="flex flex-wrap gap-2.5"
                        role="group"
                        aria-label="Interest options"
                      >
                        {INTEREST_OPTIONS.map((opt) => (
                          <Tag
                            key={opt.value}
                            label={opt.label}
                            selected={interests.includes(opt.value)}
                            onClick={() => toggleInterest(opt.value)}
                          />
                        ))}
                      </div>
                      {interests.length > 0 && (
                        <p className="mt-3 text-xs text-apex-text-tertiary">
                          {interests.length} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Step 4: Details ────────────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-6">
                      {/* Dietary */}
                      <div>
                        <p className="text-xs font-semibold text-apex-text-secondary uppercase tracking-wider mb-3">
                          Dietary preference
                        </p>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Dietary preference">
                          {DIETARY_OPTIONS.map((opt) => (
                            <Tag
                              key={opt.value}
                              label={opt.label}
                              selected={dietary === opt.value}
                              onClick={() => setDietary(opt.value)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Flight Class */}
                      <div>
                        <p className="text-xs font-semibold text-apex-text-secondary uppercase tracking-wider mb-3">
                          Preferred flight class
                        </p>
                        <div
                          className="grid grid-cols-2 gap-2.5"
                          role="radiogroup"
                          aria-label="Flight class options"
                        >
                          {FLIGHT_CLASS_OPTIONS.map((opt) => (
                            <OptionCard
                              key={opt.value}
                              icon={opt.icon}
                              title={opt.label}
                              desc={opt.desc}
                              selected={flightClass === opt.value}
                              onClick={() => setFlightClass(opt.value)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Accessibility */}
                      <div>
                        <p className="text-xs font-semibold text-apex-text-secondary uppercase tracking-wider mb-3">
                          Accessibility needs
                        </p>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Accessibility options">
                          {ACCESSIBILITY_OPTIONS.map((opt) => (
                            <Tag
                              key={opt.value}
                              label={opt.label}
                              selected={accessibility.includes(opt.value)}
                              onClick={() => toggleAccessibility(opt.value)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={step === 0}
                leftIcon="pi-arrow-left"
              >
                Back
              </Button>

              {isLastStep ? (
                <Button
                  variant="primary"
                  size="md"
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Confirm & Save'}
                  {!loading && (
                    <i className="pi pi-check ml-1 text-xs" aria-hidden="true" />
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={goNext}
                  disabled={!canProceed}
                >
                  Continue
                  <i className="pi pi-arrow-right ml-1 text-xs" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {/* Step label (mobile only — left panel is hidden) */}
          <p className="lg:hidden mt-4 text-center text-xs text-apex-text-tertiary">
            {STEPS[step].title}
          </p>
        </div>
      </main>
    </div>
  );
}
