'use client';

/*
 * GlobeCanvas.tsx — Apex Travel Orchestrator
 *
 * High-performance GitHub-style interactive 3D Globe component.
 * Features tessellated hexagonal continent boundaries, dynamic flight arcs,
 * pulsing destination beacons, and intuitive drag & auto-rotation controls.
 */

import React, { useMemo } from 'react';
import { World, GlobeConfig, Position } from '@/components/ui/globe';

/* ─── Apex Travel Brand Route Data ────────────────────────────────────────── */
const TRAVEL_ROUTES: Position[] = [
  {
    order: 1,
    startLat: 40.7128,
    startLng: -74.006, // New York (JFK)
    endLat: 51.5074,
    endLng: -0.1278, // London (LHR)
    arcAlt: 0.28,
    color: '#F59E0B', // Apex Gold
  },
  {
    order: 2,
    startLat: 51.5074,
    startLng: -0.1278, // London
    endLat: 25.2048,
    endLng: 55.2708, // Dubai (DXB)
    arcAlt: 0.25,
    color: '#06B6D4', // Cyan
  },
  {
    order: 3,
    startLat: 25.2048,
    startLng: 55.2708, // Dubai
    endLat: 19.076,
    endLng: 72.8777, // Mumbai (BOM)
    arcAlt: 0.18,
    color: '#EAB308', // Amber Gold
  },
  {
    order: 4,
    startLat: 19.076,
    startLng: 72.8777, // Mumbai
    endLat: 1.3521,
    endLng: 103.8198, // Singapore (SIN)
    arcAlt: 0.22,
    color: '#10B981', // Emerald
  },
  {
    order: 5,
    startLat: 1.3521,
    startLng: 103.8198, // Singapore
    endLat: 35.6762,
    endLng: 139.6503, // Tokyo (HND)
    arcAlt: 0.26,
    color: '#818CF8', // Indigo
  },
  {
    order: 6,
    startLat: 37.7749,
    startLng: -122.4194, // San Francisco (SFO)
    endLat: 35.6762,
    endLng: 139.6503, // Tokyo
    arcAlt: 0.35,
    color: '#F59E0B', // Gold
  },
  {
    order: 7,
    startLat: 40.7128,
    startLng: -74.006, // New York
    endLat: 37.7749,
    endLng: -122.4194, // San Francisco
    arcAlt: 0.2,
    color: '#A855F7', // Violet
  },
  {
    order: 8,
    startLat: 51.5074,
    startLng: -0.1278, // London
    endLat: 48.8566,
    endLng: 2.3522, // Paris (CDG)
    arcAlt: 0.12,
    color: '#38BDF8', // Sky
  },
  {
    order: 9,
    startLat: 48.8566,
    startLng: 2.3522, // Paris
    endLat: 41.9028,
    endLng: 12.4964, // Rome (FCO)
    arcAlt: 0.14,
    color: '#F59E0B', // Gold
  },
  {
    order: 10,
    startLat: -33.8688,
    startLng: 151.2093, // Sydney (SYD)
    endLat: 1.3521,
    endLng: 103.8198, // Singapore
    arcAlt: 0.3,
    color: '#06B6D4', // Cyan
  },
  {
    order: 11,
    startLat: -26.2041,
    startLng: 28.0473, // Johannesburg (JNB)
    endLat: 25.2048,
    endLng: 55.2708, // Dubai
    arcAlt: 0.32,
    color: '#EAB308', // Gold
  },
  {
    order: 12,
    startLat: 40.7128,
    startLng: -74.006, // New York
    endLat: -22.9068,
    endLng: -43.1729, // Rio de Janeiro (GIG)
    arcAlt: 0.3,
    color: '#14B8A6', // Teal
  },
];

/* ─── Apex Globe Visual Configuration ────────────────────────────────────── */
const APEX_GLOBE_CONFIG: GlobeConfig = {
  pointSize: 1.2,
  globeColor: '#0b112c', // Deep luxury midnight navy
  showAtmosphere: true,
  atmosphereColor: '#38bdf8', // Luminous cyan/sky halo
  atmosphereAltitude: 0.16,
  emissive: '#060919',
  emissiveIntensity: 0.12,
  shininess: 0.9,
  polygonColor: 'rgba(255, 255, 255, 0.78)', // Crisp white/cream hex polygons
  ambientLight: '#38bdf8',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#f59e0b',
  arcTime: 2000,
  arcLength: 0.85,
  rings: 2,
  maxRings: 4,
  autoRotate: true,
  autoRotateSpeed: 0.85, // Elegant, smooth auto-rotation
};

export function GlobeCanvas() {
  const globeConfig = useMemo(() => APEX_GLOBE_CONFIG, []);
  const data = useMemo(() => TRAVEL_ROUTES, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <World globeConfig={globeConfig} data={data} />
    </div>
  );
}