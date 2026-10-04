'use client';

/**
 * ParticleCanvas — soft Three.js particle sphere for the landing page hero.
 *
 * Loaded lazily via Next.js dynamic() in LandingHero.tsx (ssr: false).
 * Uses React Three Fiber. Requires:
 *   npm install three @react-three/fiber @types/three
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Particle mesh ──────────────────────────────────────────────────────── */
function Particles({ count = 2400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  /* Fibonacci sphere distribution — particles spread evenly, not clumped */
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const golden    = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
      const i2    = i + 0.5;
      const phi   = Math.acos(1 - (2 * i2) / count);
      const theta = 2 * Math.PI * (i2 / golden);
      /* Add slight random variation in radius for depth */
      const r = 1.6 + (Math.random() - 0.5) * 0.5;

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  /* Very slow drift rotation — alive but not distracting */
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.04;
    pointsRef.current.rotation.x += delta * 0.012;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.016}
        color="#1E2B5C"
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Public export — canvas wrapper ─────────────────────────────────────── */
export function ParticleCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 50 }}
      gl={{
        antialias:  false,
        alpha:      true,   // transparent background
        powerPreference: 'low-power', // battery-friendly
      }}
      dpr={[1, 1.5]}        // cap at 1.5x for performance
      style={{ background: 'transparent', pointerEvents: 'none' }}
      aria-hidden="true"   // decorative — excluded from accessibility tree
    >
      <Particles />
    </Canvas>
  );
}
