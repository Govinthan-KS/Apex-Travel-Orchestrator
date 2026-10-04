/* ─────────────────────────────────────────────────────────────────────────────
   lib/constants.ts
   Single source of truth for all static option lists and shared config.
   Import from here instead of re-declaring in individual components.
───────────────────────────────────────────────────────────────────────────── */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export const DESTINATIONS = [
  { label: 'Tokyo, Japan',        value: 'Tokyo'         },
  { label: 'Paris, France',       value: 'Paris'         },
  { label: 'New York, USA',       value: 'New York'      },
  { label: 'London, UK',          value: 'London'        },
  { label: 'Dubai, UAE',          value: 'Dubai'         },
  { label: 'Singapore',           value: 'Singapore'     },
  { label: 'Bangkok, Thailand',   value: 'Bangkok'       },
  { label: 'Rome, Italy',         value: 'Rome'          },
  { label: 'Barcelona, Spain',    value: 'Barcelona'     },
  { label: 'Sydney, Australia',   value: 'Sydney'        },
  { label: 'Toronto, Canada',     value: 'Toronto'       },
  { label: 'Berlin, Germany',     value: 'Berlin'        },
  { label: 'Mumbai, India',       value: 'Mumbai'        },
  { label: 'Chennai, India',      value: 'Chennai'       },
  { label: 'Los Angeles, USA',    value: 'Los Angeles'   },
] as const;

export const INTERESTS = [
  { label: 'Food',        value: 'food'        },
  { label: 'History',     value: 'history'     },
  { label: 'Nightlife',   value: 'nightlife'   },
  { label: 'Nature',      value: 'nature'      },
  { label: 'Culture',     value: 'culture'     },
  { label: 'Adventure',   value: 'adventure'   },
  { label: 'Shopping',    value: 'shopping'    },
  { label: 'Relaxation',  value: 'relaxation'  },
] as const;

export const PACE_OPTIONS = [
  { label: 'Relaxed',   value: 'relaxed'   },
  { label: 'Moderate',  value: 'moderate'  },
  { label: 'Intensive', value: 'intensive' },
] as const;

/** Rotating messages shown during the AI planning phase (B) */
export const LOADING_MESSAGES = [
  'Flight Intelligence is finding your best routes…',
  'Hotel Curation is matching your stay tier…',
  'Experience Design is building your days…',
  'Coordinator is cross-referencing your travel DNA…',
  'Validating routes and timing…',
  'Optimising your itinerary…',
  'Running final checks…',
  'Almost ready…',
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   Home city list — IATA code + display name for the home-hub picker.
   Stored value: IATA code (e.g. "BOM"). Displayed value: city name.
───────────────────────────────────────────────────────────────────────────── */

export const HOME_CITIES = [
  // ── India ────────────────────────────────────────────
  { code: 'BOM', name: 'Mumbai',        country: 'India' },
  { code: 'DEL', name: 'New Delhi',     country: 'India' },
  { code: 'MAA', name: 'Chennai',       country: 'India' },
  { code: 'BLR', name: 'Bengaluru',     country: 'India' },
  { code: 'HYD', name: 'Hyderabad',     country: 'India' },
  { code: 'CCU', name: 'Kolkata',       country: 'India' },
  { code: 'COK', name: 'Kochi',         country: 'India' },
  { code: 'AMD', name: 'Ahmedabad',     country: 'India' },
  { code: 'PNQ', name: 'Pune',          country: 'India' },
  { code: 'GOI', name: 'Goa',           country: 'India' },
  { code: 'JAI', name: 'Jaipur',        country: 'India' },
  { code: 'TRV', name: 'Thiruvananthapuram', country: 'India' },
  { code: 'IXC', name: 'Chandigarh',    country: 'India' },
  { code: 'VGA', name: 'Vijayawada',    country: 'India' },
  // ── Middle East ──────────────────────────────────────
  { code: 'DXB', name: 'Dubai',         country: 'UAE' },
  { code: 'AUH', name: 'Abu Dhabi',     country: 'UAE' },
  { code: 'DOH', name: 'Doha',          country: 'Qatar' },
  { code: 'RUH', name: 'Riyadh',        country: 'Saudi Arabia' },
  // ── Southeast Asia ───────────────────────────────────
  { code: 'SIN', name: 'Singapore',     country: 'Singapore' },
  { code: 'BKK', name: 'Bangkok',       country: 'Thailand' },
  { code: 'KUL', name: 'Kuala Lumpur',  country: 'Malaysia' },
  { code: 'CGK', name: 'Jakarta',       country: 'Indonesia' },
  { code: 'MNL', name: 'Manila',        country: 'Philippines' },
  // ── East Asia ────────────────────────────────────────
  { code: 'NRT', name: 'Tokyo',         country: 'Japan' },
  { code: 'HKG', name: 'Hong Kong',     country: 'Hong Kong' },
  { code: 'ICN', name: 'Seoul',         country: 'South Korea' },
  { code: 'PVG', name: 'Shanghai',      country: 'China' },
  { code: 'PEK', name: 'Beijing',       country: 'China' },
  // ── Europe ───────────────────────────────────────────
  { code: 'LHR', name: 'London',        country: 'UK' },
  { code: 'CDG', name: 'Paris',         country: 'France' },
  { code: 'FRA', name: 'Frankfurt',     country: 'Germany' },
  { code: 'AMS', name: 'Amsterdam',     country: 'Netherlands' },
  { code: 'FCO', name: 'Rome',          country: 'Italy' },
  { code: 'BCN', name: 'Barcelona',     country: 'Spain' },
  { code: 'MAD', name: 'Madrid',        country: 'Spain' },
  { code: 'IST', name: 'Istanbul',      country: 'Turkey' },
  { code: 'ZUR', name: 'Zurich',        country: 'Switzerland' },
  { code: 'VIE', name: 'Vienna',        country: 'Austria' },
  // ── Americas ─────────────────────────────────────────
  { code: 'JFK', name: 'New York',      country: 'USA' },
  { code: 'LAX', name: 'Los Angeles',   country: 'USA' },
  { code: 'ORD', name: 'Chicago',       country: 'USA' },
  { code: 'SFO', name: 'San Francisco', country: 'USA' },
  { code: 'MIA', name: 'Miami',         country: 'USA' },
  { code: 'YYZ', name: 'Toronto',       country: 'Canada' },
  { code: 'GRU', name: 'São Paulo',     country: 'Brazil' },
  // ── Africa / Oceania ─────────────────────────────────
  { code: 'JNB', name: 'Johannesburg',  country: 'South Africa' },
  { code: 'NBO', name: 'Nairobi',       country: 'Kenya' },
  { code: 'CAI', name: 'Cairo',         country: 'Egypt' },
  { code: 'SYD', name: 'Sydney',        country: 'Australia' },
  { code: 'MEL', name: 'Melbourne',     country: 'Australia' },
] as const;

export type CityEntry = typeof HOME_CITIES[number];

/** Returns the city name for a given IATA code (e.g. "BOM" → "Mumbai"). Falls back to the code itself. */
export function getCityName(code: string): string {
  const city = (HOME_CITIES as readonly CityEntry[]).find(
    (c) => c.code === code.toUpperCase()
  );
  return city ? city.name : code.toUpperCase();
}

/** Returns "BOM — Mumbai, India" format for the profile page DNA card. */
export function getCityDisplay(code: string): string {
  const city = (HOME_CITIES as readonly CityEntry[]).find(
    (c) => c.code === code.toUpperCase()
  );
  return city ? `${city.code} — ${city.name}, ${city.country}` : code.toUpperCase();
}

