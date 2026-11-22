"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Color, Vector3, Group } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

interface CountryFeatureCollection {
  type: string;
  features: object[];
}

interface GlobePoint {
  size: number;
  order: number;
  color: string;
  lat: number;
  lng: number;
}

const RING_PROPAGATION_SPEED = 3;
const CAMERA_Z = 300;

export type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

export interface WorldProps {
  globeConfig?: GlobeConfig;
  data?: Position[];
}

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr: number[] = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}

export function Globe({ globeConfig = {}, data = [] }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<Group | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const defaultProps = useMemo(
    () => ({
      pointSize: 1,
      atmosphereColor: "#38bdf8",
      showAtmosphere: true,
      atmosphereAltitude: 0.15,
      polygonColor: "rgba(255, 255, 255, 0.75)",
      globeColor: "#0b112c",
      emissive: "#060919",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      arcTime: 2000,
      arcLength: 0.9,
      rings: 1,
      maxRings: 3,
      ...globeConfig,
    }),
    [globeConfig]
  );

  // Initialize ThreeGlobe instance and mount into group
  useEffect(() => {
    const group = groupRef.current;
    let animId: number;
    if (!globeRef.current && group) {
      const globe = new ThreeGlobe();
      globeRef.current = globe;
      group.add(globe);
      animId = requestAnimationFrame(() => {
        setIsInitialized(true);
      });
    }

    return () => {
      cancelAnimationFrame(animId);
      if (globeRef.current && group) {
        group.remove(globeRef.current);
        globeRef.current = null;
      }
    };
  }, []);

  // Update globe material when config changes
  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };

    if (globeMaterial) {
      globeMaterial.color = new Color(defaultProps.globeColor);
      globeMaterial.emissive = new Color(defaultProps.emissive);
      globeMaterial.emissiveIntensity = defaultProps.emissiveIntensity;
      globeMaterial.shininess = defaultProps.shininess;
    }
  }, [
    isInitialized,
    defaultProps.globeColor,
    defaultProps.emissive,
    defaultProps.emissiveIntensity,
    defaultProps.shininess,
  ]);

  // Build polygons, arcs, points and rings
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const arcs = data;
    const points: Array<{
      size: number;
      order: number;
      color: string;
      lat: number;
      lng: number;
    }> = [];

    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    // Filter duplicates
    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          ["lat", "lng"].every((k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"])
        ) === i
    );

    const globe = globeRef.current;

    globe
      .hexPolygonsData((countries as CountryFeatureCollection).features || [])
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => defaultProps.polygonColor);

    globe
      .arcsData(data)
      .arcStartLat((d: object) => (d as Position).startLat * 1)
      .arcStartLng((d: object) => (d as Position).startLng * 1)
      .arcEndLat((d: object) => (d as Position).endLat * 1)
      .arcEndLng((d: object) => (d as Position).endLng * 1)
      .arcColor((e: object) => (e as Position).color)
      .arcAltitude((e: object) => (e as Position).arcAlt * 1)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap((e: object) => (e as Position).order * 1)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime);

    globe
      .pointsData(filteredPoints)
      .pointColor((e: object) => (e as GlobePoint).color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(2);

    globe
      .ringsData([])
      .ringColor(() => defaultProps.polygonColor)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod((defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings);
  }, [
    isInitialized,
    data,
    defaultProps.pointSize,
    defaultProps.showAtmosphere,
    defaultProps.atmosphereColor,
    defaultProps.atmosphereAltitude,
    defaultProps.polygonColor,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.rings,
    defaultProps.maxRings,
  ]);

  // Handle animated ripple rings periodically
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data || data.length === 0) return;

    const interval = setInterval(() => {
      if (!globeRef.current) return;

      const ringCount = Math.max(1, Math.floor((data.length * 4) / 5));
      const newNumbersOfRings = genRandomNumbers(0, data.length, ringCount);

      const ringsData = data
        .filter((_, i) => newNumbersOfRings.includes(i))
        .map((d) => ({
          lat: d.startLat,
          lng: d.startLng,
          color: d.color,
        }));

      globeRef.current.ringsData(ringsData);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
}

export function WebGLRendererConfig() {
  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(0x000000, 0);
  }, [gl]);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig = {} } = props;

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{
        fov: 50,
        near: 180,
        far: 1800,
        position: [0, 0, CAMERA_Z],
      }}
      style={{ background: "transparent" }}
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight || "#38bdf8"} intensity={0.7} />
      <directionalLight
        color={globeConfig.directionalLeftLight || "#ffffff"}
        position={new Vector3(-400, 100, 400)}
        intensity={0.8}
      />
      <directionalLight
        color={globeConfig.directionalTopLight || "#ffffff"}
        position={new Vector3(-200, 500, 200)}
        intensity={0.9}
      />
      <pointLight
        color={globeConfig.pointLight || "#ffffff"}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={CAMERA_Z}
        maxDistance={CAMERA_Z}
        autoRotate={globeConfig.autoRotate ?? true}
        autoRotateSpeed={globeConfig.autoRotateSpeed ?? 1.2}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}
