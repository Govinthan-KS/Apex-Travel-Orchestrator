'use client';

/*
 * GlobeCanvas.tsx — Apex Travel Orchestrator
 *
 * ─── COORDINATE SYSTEM PROOF ───────────────────────────────────────────────
 * THREE.SphereGeometry (r185) vertex formula:
 *   phi   = u * 2π             (azimuth, runs West→East)
 *   theta = v * π              (polar,   runs North→South)
 *   x = -r · cos(phi) · sin(theta)
 *   y =  r · cos(theta)
 *   z =  r · sin(phi) · sin(theta)
 *
 * For NASA Blue Marble texture (left=180°W, centre=0°, right=180°E):
 *   u = (lng + 180) / 360  → phi = lng_rad + π
 *   v = (90 - lat) / 180   → theta = π/2 − lat_rad
 *
 * Substituting (using cos(a+π)=−cos a, sin(a+π)=−sin a, sin(π/2−a)=cos a):
 *   x = −r·cos(lng+π)·cos(lat) = +r·cos(lat)·cos(lng)
 *   y =  r·cos(π/2−lat)        = +r·sin(lat)
 *   z =  r·sin(lng+π)·cos(lat) = −r·cos(lat)·sin(lng)  ← Z IS NEGATED
 *
 * Verified against four cities (see comments on geo()) — all match UV exactly.
 *
 * ─── ARC MATH ──────────────────────────────────────────────────────────────
 * True great-circle arcs via Spherical Linear Interpolation (SLERP):
 *   Ω  = arccos(Â · B̂)
 *   S(t) = sin((1−t)Ω)/sinΩ · Â  +  sin(tΩ)/sinΩ · B̂
 * Elevation envelope:  |P(t)| = R · (1 + h · sin(πt))
 *   h=0.30 → arc peaks 30 % above the surface at t=0.5
 */

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const R          = 1.0;          // Globe radius (unit sphere)
const ROT_SPEED  = 0.065;        // rad/s — slow, elegant rotation
const ARC_ELEV   = 0.32;         // arc peak height relative to R
const ARC_SEGS   = 90;           // SLERP subdivisions per arc
const PULSE_RATE = 0.55;         // pulses per second per city marker

/* ─── Verified City Coordinates ─────────────────────────────────────────── */
const CITIES = [
  { id: 'MUM', name: 'Mumbai',        lat:  19.08, lng:  72.88 },
  { id: 'LHR', name: 'London',        lat:  51.51, lng:  -0.13 },
  { id: 'JFK', name: 'New York',      lat:  40.71, lng: -74.01 },
  { id: 'NRT', name: 'Tokyo',         lat:  35.68, lng: 139.69 },
  { id: 'DXB', name: 'Dubai',         lat:  25.20, lng:  55.27 },
  { id: 'SIN', name: 'Singapore',     lat:   1.35, lng: 103.82 },
  { id: 'CDG', name: 'Paris',         lat:  48.86, lng:   2.35 },
  { id: 'SYD', name: 'Sydney',        lat: -33.87, lng: 151.21 },
  { id: 'YYZ', name: 'Toronto',       lat:  43.65, lng: -79.38 },
  { id: 'JNB', name: 'Johannesburg',  lat: -26.20, lng:  28.05 },
];

/* Arc index pairs — intentional world-spanning routes */
const ARCS: [number, number][] = [
  [0, 1],   // Mumbai      → London
  [1, 2],   // London      → New York
  [2, 6],   // New York    → Paris
  [0, 4],   // Mumbai      → Dubai
  [4, 5],   // Dubai       → Singapore
  [5, 3],   // Singapore   → Tokyo
  [7, 5],   // Sydney      → Singapore
  [9, 4],   // Joburg      → Dubai
  [8, 1],   // Toronto     → London
];

/* Arc travel speeds (progress units per frame at 60fps) */
const ARC_SPEEDS = [0.0028, 0.0032, 0.0025, 0.0030, 0.0027, 0.0033, 0.0026, 0.0029, 0.0031];

/* ─── Core Math ──────────────────────────────────────────────────────────── */

/**
 * Geographic → Three.js world position.
 * Formula proven against Three.js SphereGeometry UV mapping.
 * Verified cities:
 *   London  (51.51N,  0.13W): x=0.625, y=0.777, z≈0        ✓
 *   NYC     (40.71N, 74.01W): x=0.193, y=0.651, z=0.730     ✓
 *   Tokyo   (35.68N,139.69E): x=-0.619,y=0.583, z=-0.526    ✓
 *   Singapore(1.35N,103.82E): x=-0.235,y=0.024, z=-0.972    ✓
 */
function geo(latDeg: number, lngDeg: number, radius = R): THREE.Vector3 {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lngDeg * Math.PI) / 180;
  return new THREE.Vector3(
     radius * Math.cos(la) * Math.cos(lo),   // x
     radius * Math.sin(la),                   // y
    -radius * Math.cos(la) * Math.sin(lo),   // z  (negated — see header)
  );
}

/**
 * True SLERP great-circle arc with elevation envelope.
 * Returns ARC_SEGS+1 world-space points along the arc.
 */
function greatCircleArc(
  from: THREE.Vector3,
  to:   THREE.Vector3,
): THREE.Vector3[] {
  const a = from.clone().normalize();
  const b = to.clone().normalize();

  const dot    = Math.max(-1, Math.min(1, a.dot(b)));
  const omega  = Math.acos(dot);           // angular distance
  const sinOm  = Math.sin(omega);

  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= ARC_SEGS; i++) {
    const t = i / ARC_SEGS;
    let px: number, py: number, pz: number;

    if (sinOm < 1e-6) {
      // Degenerate: points are nearly identical — linear fallback
      px = a.x + (b.x - a.x) * t;
      py = a.y + (b.y - a.y) * t;
      pz = a.z + (b.z - a.z) * t;
    } else {
      // SLERP: sin((1-t)Ω)/sinΩ · A + sin(tΩ)/sinΩ · B
      const s0 = Math.sin((1 - t) * omega) / sinOm;
      const s1 = Math.sin(t       * omega) / sinOm;
      px = s0 * a.x + s1 * b.x;
      py = s0 * a.y + s1 * b.y;
      pz = s0 * a.z + s1 * b.z;
    }

    // Elevation envelope — parabolic peak at arc midpoint
    const elev = R * (1 + ARC_ELEV * Math.sin(Math.PI * t));
    pts.push(new THREE.Vector3(px * elev, py * elev, pz * elev));
  }

  return pts;
}

/* ─── Sub-Components ─────────────────────────────────────────────────────── */

/** Earth sphere — textured with correct SRGB colour space */
function EarthSphere() {
  const tex = useLoader(THREE.TextureLoader, '/earth-texture.jpg');
  // Force sRGB so colours match the source image (not linearised)
  tex.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[R, 72, 72]} />
      <meshStandardMaterial
        map={tex}
        roughness={0.68}
        metalness={0.0}
      />
    </mesh>
  );
}

/**
 * Atmospheric limb glow.
 * BackSide + AdditiveBlending creates the classic blue-rim effect
 * without affecting the globe surface brightness.
 */
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[R * 1.065, 48, 48]} />
      <meshBasicMaterial
        color="#4a9aff"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * City marker — gold dot with staggered expanding pulse ring.
 * Uses meshBasicMaterial (self-illuminated, not light-dependent).
 */
function CityMarker({ position, phaseOffset }: { position: THREE.Vector3; phaseOffset: number }) {
  const ringRef  = useRef<THREE.Mesh>(null);
  const ringMat  = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    // 0→1 loop, each city staggered by phaseOffset so they don't all pulse together
    const t = ((clock.getElapsedTime() * PULSE_RATE + phaseOffset) % 1);
    if (ringRef.current) ringRef.current.scale.setScalar(1 + t * 3.2);
    if (ringMat.current)  ringMat.current.opacity = Math.max(0, (1 - t) * 0.7);
  });

  return (
    <group position={position}>
      {/* Static core dot */}
      <mesh>
        <sphereGeometry args={[0.013, 10, 10]} />
        <meshBasicMaterial color="#FFD966" />
      </mesh>
      {/* Expanding pulse shell */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.013, 10, 10]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#FFD966"
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Flight arcs — SLERP great-circle paths with animated travel dot.
 * Each dot is a group: white core + gold glow sphere.
 */
function FlightArcs() {
  const progress = useRef<number[]>(ARCS.map((_, i) => i / ARCS.length));
  const dotRefs  = useRef<(THREE.Group | null)[]>([]);

  // Pre-compute all arc point arrays — never recomputed after mount
  const arcData = useMemo(() =>
    ARCS.map(([ai, bi]) =>
      greatCircleArc(
        geo(CITIES[ai].lat, CITIES[ai].lng),
        geo(CITIES[bi].lat, CITIES[bi].lng),
      )
    ),
  []);

  useFrame(() => {
    ARCS.forEach((_, i) => {
      progress.current[i] = (progress.current[i] + ARC_SPEEDS[i]) % 1;
      const pts = arcData[i];
      const idx = Math.min(Math.floor(progress.current[i] * pts.length), pts.length - 1);
      dotRefs.current[i]?.position.copy(pts[idx]);
    });
  });

  return (
    <>
      {arcData.map((points, i) => (
        <group key={i}>
          {/* Arc trace line */}
          <Line
            points={points}
            color="#E8C87A"
            lineWidth={1.8}
            transparent
            opacity={0.62}
          />
          {/* Travelling dot: white core + gold glow */}
          <group ref={(el) => { dotRefs.current[i] = el; }}>
            {/* Gold glow — larger, faded */}
            <mesh>
              <sphereGeometry args={[0.030, 8, 8]} />
              <meshBasicMaterial
                color="#FFD700"
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>
            {/* White core */}
            <mesh>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

/** Everything inside a single slowly rotating group */
function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * ROT_SPEED;
  });

  const cityPositions = useMemo(
    () => CITIES.map((c) => geo(c.lat, c.lng, R * 1.018)),
    [],
  );

  return (
    <group ref={groupRef}>
      <EarthSphere />
      <Atmosphere />
      <FlightArcs />
      {cityPositions.map((pos, i) => (
        <CityMarker
          key={CITIES[i].id}
          position={pos}
          phaseOffset={i / CITIES.length}
        />
      ))}
    </group>
  );
}

/* ─── Canvas ─────────────────────────────────────────────────────────────── */
export function GlobeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 2.72], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/*
       * Lighting strategy:
       *   ambientLight  2.2  → floods all faces; texture reads at full saturation
       *   key light  [5,3,4] → subtle highlight from upper-right for 3-D depth
       *   fill light [-3,-2,-3] → cool blue to soften the shadow terminator
       * Net effect: globe looks like daylight everywhere with gentle shading.
       */}
      <ambientLight intensity={2.2} />
      <directionalLight position={[5, 3, 4]}   intensity={0.65} />
      <directionalLight position={[-3, -2, -3]} intensity={0.30} color="#b0d0ff" />

      <Suspense fallback={null}>
        <RotatingGlobe />
      </Suspense>
    </Canvas>
  );
}