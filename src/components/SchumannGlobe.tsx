"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import {
  Compass,
  Crosshair,
  Radio,
  RotateCw,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getSchumannDataset,
  computeIonosphericHeatmap,
  computeCoherenceArcs,
  QBurstGeolocationEvent,
  SchumannDataRecord,
} from "@/lib/schumann-data";
import { getTacticalEarthTexture } from "@/lib/earth-texture";
import { useResonanceStore } from "@/store/useResonanceStore";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#030712] text-cyan-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        <span className="font-mono text-xs tracking-[0.25em] uppercase text-cyan-300/80">
          Initializing Ionospheric Cavity Engine...
        </span>
      </div>
    </div>
  ),
});

function getMetricColor(
  record: SchumannDataRecord,
  metric: "amplitude" | "frequency" | "quality_factor" | "q_burst"
): string {
  if (metric === "q_burst" || (metric === "amplitude" && record.is_q_burst)) {
    if (record.q_burst_intensity >= 62) return "#f43f5e";
    if (record.q_burst_intensity >= 42) return "#f59e0b";
    return "#38bdf8";
  }
  if (metric === "amplitude") {
    if (record.amplitude >= 62) return "#f43f5e";
    if (record.amplitude >= 45) return "#f59e0b";
    if (record.amplitude >= 32) return "#10b981";
    return "#38bdf8";
  }
  if (metric === "frequency") {
    const delta = record.primary_frequency - 7.83;
    if (delta > 0.045) return "#f43f5e";
    if (delta > 0.015) return "#f59e0b";
    if (delta < -0.03) return "#818cf8";
    return "#10b981";
  }
  if (record.quality_factor >= 7.8) return "#10b981";
  if (record.quality_factor >= 6.0) return "#38bdf8";
  return "#f59e0b";
}

function getMetricFormattedValue(
  record: SchumannDataRecord,
  metric: "amplitude" | "frequency" | "quality_factor" | "q_burst",
  harmonic: 1 | 2 | 3 | 4 | 5
): string {
  if (metric === "amplitude") return `${record.amplitude.toFixed(1)} pT²/Hz`;
  if (metric === "quality_factor") return `Q ${record.quality_factor.toFixed(2)}`;
  if (metric === "q_burst") return `${record.q_burst_intensity.toFixed(0)} pT`;
  const freqMap = {
    1: record.primary_frequency,
    2: record.harmonic_2,
    3: record.harmonic_3,
    4: record.harmonic_4,
    5: record.harmonic_5,
  };
  return `${freqMap[harmonic].toFixed(2)} Hz`;
}

type HtmlMarkerDatum =
  | { kind: "station"; record: SchumannDataRecord }
  | { kind: "epicenter"; event: QBurstGeolocationEvent };

export default function SchumannGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const ionosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const ionosphereWireRef = useRef<THREE.LineSegments | null>(null);

  const [dimensions, setDimensions] = useState({ width: 960, height: 640 });
  const [textures, setTextures] = useState({ mapUrl: "", bumpUrl: "" });
  const [globeReady, setGlobeReady] = useState(false);

  const anchorHourEpochMs = useResonanceStore((s) => s.anchorHourEpochMs);
  const provenance = useResonanceStore((s) => s.provenance);
  const dataset = useMemo(
    () =>
      getSchumannDataset(
        anchorHourEpochMs,
        provenance.liveOverridesByHourEpoch
      ),
    [anchorHourEpochMs, provenance.liveOverridesByHourEpoch]
  );

  const timeIndex = useResonanceStore((s) => s.timeIndex);
  const selectedStationId = useResonanceStore((s) => s.selectedStationId);
  const inspectingQBurst = useResonanceStore((s) => s.inspectingQBurst);
  const activeMetric = useResonanceStore((s) => s.activeMetric);
  const selectedHarmonic = useResonanceStore((s) => s.selectedHarmonic);
  const layers = useResonanceStore((s) => s.layers);
  const cameraTarget = useResonanceStore((s) => s.cameraTarget);

  const selectStation = useResonanceStore((s) => s.selectStation);
  const selectQBurstEpicenter = useResonanceStore(
    (s) => s.selectQBurstEpicenter
  );
  const toggleLayer = useResonanceStore((s) => s.toggleLayer);
  const resetGlobeView = useResonanceStore((s) => s.resetGlobeView);

  const currentRecords = useMemo(
    () => dataset.recordsByTime[timeIndex] || dataset.recordsByTime[0],
    [dataset, timeIndex]
  );

  const currentGlobal = useMemo(
    () => dataset.globalBaseline[timeIndex] || dataset.globalBaseline[0],
    [dataset, timeIndex]
  );

  useEffect(() => {
    setTextures(getTacticalEarthTexture());
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const controls = globeRef.current.controls?.();
    if (controls) {
      controls.autoRotate = layers.autoRotateGlobe;
      controls.autoRotateSpeed = 0.55;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 135;
      controls.maxDistance = 460;
    }
  }, [globeReady, layers.autoRotateGlobe]);

  useEffect(() => {
    if (!globeReady || !globeRef.current || !cameraTarget) return;
    globeRef.current.pointOfView(
      {
        lat: cameraTarget.lat,
        lng: cameraTarget.lng,
        altitude: cameraTarget.altitude,
      },
      900
    );
  }, [globeReady, cameraTarget]);

  // Build and dynamically update the 3D semi-transparent Ionospheric Cavity Resonance Mesh over the globe
  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const scene: THREE.Scene | undefined = globeRef.current.scene?.();
    if (!scene) return;

    if (!ionosphereMeshRef.current) {
      const geometry = new THREE.SphereGeometry(103.8, 56, 36);
      const count = geometry.attributes.position.count;
      const colors = new Float32Array(count * 3);
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "ionospheric-cavity-heatmap";
      scene.add(mesh);
      ionosphereMeshRef.current = mesh;

      const wireGeo = new THREE.WireframeGeometry(
        new THREE.SphereGeometry(104.1, 24, 14)
      );
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      scene.add(wire);
      ionosphereWireRef.current = wire;
    }

    const mesh = ionosphereMeshRef.current;
    const wire = ionosphereWireRef.current;
    if (!mesh) return;

    mesh.visible = layers.showIonosphericHeatmap;
    if (wire) wire.visible = layers.showIonosphericHeatmap;

    if (!layers.showIonosphericHeatmap) return;

    // Scale cavity shell radius subtly with coupled mean D-region altitude (55..84 km)
    const altitudeScale =
      1 + ((currentGlobal.mean_d_region_km - 70) / 100) * 0.015;
    mesh.scale.setScalar(altitudeScale);

    const geo = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    const color = new THREE.Color();

    const chimneyLng = ((14 - (timeIndex % 24)) * 15 + 540) % 360 - 180;

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const r = vertex.length();
      const lat = 90 - (Math.acos(vertex.y / r) * 180) / Math.PI;
      const lng =
        ((Math.atan2(vertex.x, vertex.z) * 180) / Math.PI + 540) % 360 - 180;

      let weightedVal = 0;
      let weightSum = 0;

      for (const st of currentRecords) {
        const dLat = lat - st.latitude;
        const dLng = ((lng - st.longitude + 540) % 360) - 180;
        const distSq = dLat * dLat + dLng * dLng + 180;
        const w = 1 / distSq;

        const scalar =
          activeMetric === "amplitude"
            ? (st.amplitude - 15) / 80
            : activeMetric === "frequency"
            ? (st.primary_frequency - 7.68) / 0.34
            : activeMetric === "quality_factor"
            ? (st.quality_factor - 3.8) / 7.5
            : st.q_burst_intensity / 100;

        weightedVal += scalar * w;
        weightSum += w;
      }

      const dChimney = ((lng - chimneyLng + 540) % 360) - 180;
      const chimneyBoost =
        Math.exp(-(lat * lat) / 1100) *
        Math.exp(-(dChimney * dChimney) / 2800) *
        0.26;

      const intensity = Math.min(
        1,
        Math.max(0.05, weightedVal / weightSum + chimneyBoost)
      );

      if (intensity < 0.35) {
        color.setHSL(0.55 - intensity * 0.15, 0.9, 0.22 + intensity * 0.45);
      } else if (intensity < 0.65) {
        color.setHSL(0.45 - (intensity - 0.35) * 0.9, 0.95, 0.45);
      } else {
        color.setHSL(0.08 - (intensity - 0.65) * 0.22, 0.98, 0.54);
      }

      colAttr.setXYZ(i, color.r, color.g, color.b);
    }

    colAttr.needsUpdate = true;
  }, [
    globeReady,
    currentRecords,
    currentGlobal.mean_d_region_km,
    timeIndex,
    activeMetric,
    layers.showIonosphericHeatmap,
  ]);

  useEffect(() => {
    return () => {
      if (globeRef.current?.scene) {
        const scene = globeRef.current.scene();
        if (ionosphereMeshRef.current) scene?.remove(ionosphereMeshRef.current);
        if (ionosphereWireRef.current) scene?.remove(ionosphereWireRef.current);
      }
    };
  }, []);

  const heatmapCells = useMemo(() => {
    if (!layers.showIonosphericHeatmap) return [];
    return computeIonosphericHeatmap(currentRecords, timeIndex, activeMetric);
  }, [currentRecords, timeIndex, activeMetric, layers.showIonosphericHeatmap]);

  const globePointsData = useMemo(() => {
    const pts: Array<{
      id: string;
      lat: number;
      lng: number;
      altitude: number;
      radius: number;
      color: string;
      isStation: boolean;
      isEpicenter?: boolean;
      record?: SchumannDataRecord;
      qBurstEvent?: QBurstGeolocationEvent;
    }> = [];

    if (layers.showStationNodes) {
      for (const rec of currentRecords) {
        const isSelected = rec.location_id === selectedStationId;
        const metricScalar =
          activeMetric === "amplitude"
            ? rec.amplitude / 100
            : activeMetric === "frequency"
            ? (rec.primary_frequency - 7.6) / 0.5
            : activeMetric === "quality_factor"
            ? rec.quality_factor / 12
            : rec.q_burst_intensity / 100;

        pts.push({
          id: rec.location_id,
          lat: rec.latitude,
          lng: rec.longitude,
          altitude: Math.max(
            0.05,
            metricScalar * 0.22 + (isSelected ? 0.05 : 0)
          ),
          radius: isSelected ? 1.15 : 0.78,
          color: getMetricColor(rec, activeMetric),
          isStation: true,
          record: rec,
        });
      }
    }

    // Add interactive Q-Burst Super-Bolt Epicenter column when active
    if (layers.showQBurstRings && currentGlobal.q_burst_event) {
      const ev = currentGlobal.q_burst_event;
      pts.push({
        id: ev.event_id,
        lat: ev.epicenter_lat,
        lng: ev.epicenter_lng,
        altitude: 0.26,
        radius: 1.35,
        color: "#f43f5e",
        isStation: false,
        isEpicenter: true,
        qBurstEvent: ev,
      });
    }

    if (layers.showIonosphericHeatmap) {
      for (let i = 0; i < heatmapCells.length; i++) {
        const c = heatmapCells[i];
        if (c.intensity > 0.42) {
          pts.push({
            id: `hm-${i}`,
            lat: c.lat,
            lng: c.lng,
            altitude: 0.008,
            radius: c.radius * 0.35,
            color: c.color,
            isStation: false,
          });
        }
      }
    }

    return pts;
  }, [
    currentRecords,
    currentGlobal.q_burst_event,
    selectedStationId,
    activeMetric,
    layers.showStationNodes,
    layers.showQBurstRings,
    layers.showIonosphericHeatmap,
    heatmapCells,
  ]);

  // Pulsing rings for Q-Burst Super-Bolt Epicenter + active stations
  const ringsData = useMemo(() => {
    const rings: Array<{
      lat: number;
      lng: number;
      maxR: number;
      propagationSpeed: number;
      repeatPeriod: number;
      color: (t: number) => string;
    }> = [];

    if (layers.showQBurstRings && currentGlobal.q_burst_event) {
      const ev = currentGlobal.q_burst_event;
      rings.push({
        lat: ev.epicenter_lat,
        lng: ev.epicenter_lng,
        maxR: 26,
        propagationSpeed: 5.2,
        repeatPeriod: 520,
        color: (t: number) => `rgba(244, 63, 94, ${Math.max(0, 1 - t)})`,
      });
    }

    for (const rec of currentRecords) {
      const isSelected = rec.location_id === selectedStationId;
      if (layers.showQBurstRings && rec.is_q_burst) {
        rings.push({
          lat: rec.latitude,
          lng: rec.longitude,
          maxR: 9 + (rec.q_burst_intensity / 100) * 8,
          propagationSpeed: 3.4,
          repeatPeriod: 680,
          color: (t: number) => `rgba(244, 63, 94, ${Math.max(0, 0.9 - t)})`,
        });
      } else if (layers.showStationNodes) {
        rings.push({
          lat: rec.latitude,
          lng: rec.longitude,
          maxR: isSelected ? 7.5 : 4.2,
          propagationSpeed: isSelected ? 2.2 : 1.3,
          repeatPeriod: isSelected ? 900 : 1400,
          color: (t: number) =>
            isSelected
              ? `rgba(34, 211, 238, ${Math.max(0, 0.95 - t)})`
              : `rgba(16, 185, 129, ${Math.max(0, 0.55 - t)})`,
        });
      }
    }
    return rings;
  }, [
    currentRecords,
    currentGlobal.q_burst_event,
    selectedStationId,
    layers.showQBurstRings,
    layers.showStationNodes,
  ]);

  const arcsData = useMemo(() => {
    if (!layers.showCoherenceArcs && !inspectingQBurst) return [];
    return computeCoherenceArcs(
      currentRecords,
      selectedStationId,
      currentGlobal.q_burst_event,
      inspectingQBurst
    );
  }, [
    currentRecords,
    selectedStationId,
    currentGlobal.q_burst_event,
    inspectingQBurst,
    layers.showCoherenceArcs,
  ]);

  // Combine interactive HTML markers for stations + Q-Burst Super-Bolt Epicenter
  const htmlMarkersData = useMemo(() => {
    const items: Array<HtmlMarkerDatum & { lat: number; lng: number }> = [];
    if (layers.showStationNodes) {
      for (const rec of currentRecords) {
        items.push({
          kind: "station",
          lat: rec.latitude,
          lng: rec.longitude,
          record: rec,
        });
      }
    }
    if (layers.showQBurstRings && currentGlobal.q_burst_event) {
      const ev = currentGlobal.q_burst_event;
      items.push({
        kind: "epicenter",
        lat: ev.epicenter_lat,
        lng: ev.epicenter_lng,
        event: ev,
      });
    }
    return items;
  }, [
    currentRecords,
    currentGlobal.q_burst_event,
    layers.showStationNodes,
    layers.showQBurstRings,
  ]);

  const handleZoom = (factor: number) => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    if (pov) {
      const nextAlt = Math.max(0.6, Math.min(3.4, pov.altitude * factor));
      globeRef.current.pointOfView({ ...pov, altitude: nextAlt }, 350);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#030712] select-none"
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 48%, rgba(2, 6, 23, 0.78) 100%)",
        }}
      />

      {/* Top HUD Telemetry Bar floating over the center viewport */}
      <div className="pointer-events-none absolute top-3.5 right-3.5 left-3.5 z-20 flex flex-wrap items-start justify-between gap-2.5">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3.5 rounded-xl border border-cyan-500/25 bg-slate-950/85 px-3.5 py-2 shadow-[0_0_30px_rgba(6,182,212,0.12)] backdrop-blur-md">
          <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            <div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">
                Global Mode-{selectedHarmonic} Resonance
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-base font-bold tracking-tight text-cyan-300">
                  {selectedHarmonic === 1
                    ? currentGlobal.global_primary_frequency.toFixed(3)
                    : (
                        currentGlobal.global_primary_frequency *
                        (selectedHarmonic * 0.91 + 0.09)
                      ).toFixed(2)}{" "}
                  Hz
                </span>
                <span
                  className={`font-mono text-xs ${
                    currentGlobal.global_primary_frequency >= 7.83
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {currentGlobal.global_primary_frequency >= 7.83 ? "+" : ""}
                  {(currentGlobal.global_primary_frequency - 7.83).toFixed(3)} Hz
                </span>
              </div>
            </div>
          </div>

          <div className="pr-3 border-r border-slate-800">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">
              Mean Cavity PSD
            </div>
            <div className="font-mono text-sm font-semibold text-emerald-300">
              {currentGlobal.global_amplitude.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">pT²/Hz</span>
            </div>
          </div>

          <div className="pr-3 border-r border-slate-800">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">
              Global Q / D-Alt
            </div>
            <div className="font-mono text-sm font-semibold text-sky-300">
              {currentGlobal.global_quality_factor.toFixed(2)} Q{" "}
              <span className="text-xs font-normal text-slate-400">
                · {currentGlobal.mean_d_region_km} km
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (currentGlobal.q_burst_event) {
                  selectQBurstEpicenter(
                    currentGlobal.q_burst_event.epicenter_lat,
                    currentGlobal.q_burst_event.epicenter_lng,
                    true
                  );
                }
              }}
              title="Click to jump to Q-Burst Super-Bolt Epicenter & Δt Triangulation"
              className="text-left group cursor-pointer"
            >
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400 group-hover:text-rose-300">
                Q-Burst Transients
              </div>
              <div className="flex items-center gap-1 font-mono text-sm font-semibold">
                <Zap
                  className={`h-3.5 w-3.5 ${
                    currentGlobal.active_q_bursts > 0
                      ? "text-rose-400 animate-pulse"
                      : "text-slate-500"
                  }`}
                />
                <span
                  className={
                    currentGlobal.active_q_bursts > 0
                      ? "text-rose-400 underline decoration-rose-500/50 underline-offset-2"
                      : "text-slate-300"
                  }
                >
                  {currentGlobal.active_q_bursts} ACTIVE
                </span>
              </div>
            </button>

            <div
              className={`rounded-lg border px-2 py-1 font-mono text-xs font-semibold ${
                currentGlobal.kp_index >= 5
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                  : currentGlobal.kp_index >= 3.5
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              }`}
            >
              Kp {currentGlobal.kp_index.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Right Floating Camera Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/85 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleZoom(0.78)}
            title="Zoom In"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-cyan-500/15 hover:text-cyan-300"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(1.25)}
            title="Zoom Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-cyan-500/15 hover:text-cyan-300"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleLayer("autoRotateGlobe")}
            title="Toggle Orbital Auto-Rotation"
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs transition ${
              layers.autoRotateGlobe
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${
                layers.autoRotateGlobe ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">ORBIT</span>
          </button>
          <button
            type="button"
            onClick={resetGlobeView}
            title="Reset Global Perspective"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs text-slate-300 transition hover:bg-cyan-500/15 hover:text-cyan-300"
          >
            <Compass className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>

      {/* Interactive 3D Globe */}
      {textures.mapUrl && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(3, 7, 18, 1)"
          globeImageUrl={textures.mapUrl}
          bumpImageUrl={textures.bumpUrl}
          showAtmosphere={layers.showAtmosphereGlow}
          atmosphereColor="#06b6d4"
          atmosphereAltitude={0.18}
          onGlobeReady={() => {
            setGlobeReady(true);
            if (globeRef.current) {
              globeRef.current.pointOfView(
                { lat: 28, lng: 35, altitude: 2.15 },
                0
              );
            }
          }}
          pointsData={globePointsData}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="altitude"
          pointRadius="radius"
          pointColor="color"
          pointsMerge={false}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPointClick={(pt: any) => {
            if (pt?.isEpicenter && pt?.qBurstEvent) {
              selectQBurstEpicenter(
                pt.qBurstEvent.epicenter_lat,
                pt.qBurstEvent.epicenter_lng,
                true
              );
            } else if (pt?.isStation && pt?.record) {
              selectStation(pt.record.location_id, true);
            }
          }}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor="color"
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.45}
          arcDashGap={0.2}
          arcDashAnimateTime={inspectingQBurst ? 1100 : 2200}
          arcStroke={inspectingQBurst ? 0.85 : 0.55}
          arcAltitudeAutoScale={0.32}
          htmlElementsData={htmlMarkersData}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.03}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          htmlElement={(d: any) => {
            const item = d as HtmlMarkerDatum;
            const wrapper = document.createElement("div");
            wrapper.style.pointerEvents = "auto";
            wrapper.style.cursor = "pointer";
            wrapper.style.transform = "translate(-50%, -120%)";
            wrapper.style.transition = "transform 150ms ease";

            if (item.kind === "epicenter") {
              const ev = item.event;
              const badge = document.createElement("div");
              badge.style.display = "flex";
              badge.style.alignItems = "center";
              badge.style.gap = "6px";
              badge.style.padding = "4px 8px";
              badge.style.borderRadius = "6px";
              badge.style.background = inspectingQBurst
                ? "rgba(136, 19, 55, 0.94)"
                : "rgba(76, 5, 25, 0.88)";
              badge.style.border = "1.5px solid #fb7185";
              badge.style.boxShadow = "0 0 20px rgba(244, 63, 94, 0.7)";
              badge.style.fontFamily =
                "ui-monospace, SFMono-Regular, Menlo, monospace";
              badge.style.whiteSpace = "nowrap";

              const dot = document.createElement("span");
              dot.style.width = "8px";
              dot.style.height = "8px";
              dot.style.borderRadius = "9999px";
              dot.style.background = "#fb7185";
              dot.style.boxShadow = "0 0 10px #f43f5e";
              dot.style.display = "inline-block";

              const textCol = document.createElement("div");
              textCol.style.display = "flex";
              textCol.style.flexDirection = "column";
              textCol.style.lineHeight = "1.1";

              const titleSpan = document.createElement("span");
              titleSpan.style.fontSize = "10px";
              titleSpan.style.fontWeight = "700";
              titleSpan.style.color = "#fecdd3";
              titleSpan.textContent = `⚡ ${ev.event_id} EPICENTER`;

              const subSpan = document.createElement("span");
              subSpan.style.fontSize = "9px";
              subSpan.style.color = "#fda4af";
              subSpan.textContent = `${ev.charge_moment_c_km} C·km (Click Δt)`;

              textCol.appendChild(titleSpan);
              textCol.appendChild(subSpan);
              badge.appendChild(dot);
              badge.appendChild(textCol);
              wrapper.appendChild(badge);

              wrapper.onclick = (e) => {
                e.stopPropagation();
                selectQBurstEpicenter(ev.epicenter_lat, ev.epicenter_lng, true);
              };
              return wrapper;
            }

            const rec = item.record;
            const isSelected = rec.location_id === selectedStationId;
            const accentColor = getMetricColor(rec, activeMetric);
            const readout = inspectingQBurst
              ? `Δt +${rec.q_burst_arrival_ms.toFixed(1)} ms`
              : getMetricFormattedValue(rec, activeMetric, selectedHarmonic);

            const badge = document.createElement("div");
            badge.style.display = "flex";
            badge.style.alignItems = "center";
            badge.style.gap = "6px";
            badge.style.padding = "4px 8px";
            badge.style.borderRadius = "6px";
            badge.style.background = isSelected
              ? "rgba(8, 47, 73, 0.92)"
              : "rgba(2, 6, 23, 0.84)";
            badge.style.border = `1.5px solid ${
              isSelected ? "#22d3ee" : accentColor
            }`;
            badge.style.boxShadow = isSelected
              ? "0 0 18px rgba(34, 211, 238, 0.55)"
              : "0 4px 12px rgba(0, 0, 0, 0.65)";
            badge.style.fontFamily =
              "ui-monospace, SFMono-Regular, Menlo, monospace";
            badge.style.whiteSpace = "nowrap";
            badge.style.backdropFilter = "blur(6px)";

            const dot = document.createElement("span");
            dot.style.width = "8px";
            dot.style.height = "8px";
            dot.style.borderRadius = "9999px";
            dot.style.background = accentColor;
            dot.style.boxShadow = `0 0 8px ${accentColor}`;
            dot.style.display = "inline-block";

            const textCol = document.createElement("div");
            textCol.style.display = "flex";
            textCol.style.flexDirection = "column";
            textCol.style.lineHeight = "1.1";

            const titleSpan = document.createElement("span");
            titleSpan.style.fontSize = "10px";
            titleSpan.style.fontWeight = "700";
            titleSpan.style.color = isSelected ? "#67e8f9" : "#e2e8f0";
            titleSpan.style.letterSpacing = "0.06em";
            titleSpan.textContent = rec.location_id;

            const valueSpan = document.createElement("span");
            valueSpan.style.fontSize = "9px";
            valueSpan.style.color = inspectingQBurst ? "#fda4af" : accentColor;
            valueSpan.style.fontWeight = "600";
            valueSpan.textContent = readout;

            textCol.appendChild(titleSpan);
            textCol.appendChild(valueSpan);
            badge.appendChild(dot);
            badge.appendChild(textCol);
            wrapper.appendChild(badge);

            wrapper.onclick = (e) => {
              e.stopPropagation();
              selectStation(rec.location_id, true);
            };

            return wrapper;
          }}
        />
      )}

      {/* Bottom-Left Legend & Quick Station Strip */}
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-end justify-between gap-2.5">
        <div className="pointer-events-auto rounded-xl border border-slate-800/90 bg-slate-950/85 px-3.5 py-2 backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">
              Cavity Field Overlay:{" "}
              <span className="text-cyan-300">
                {activeMetric === "amplitude"
                  ? "Amplitude PSD (pT²/Hz)"
                  : activeMetric === "frequency"
                  ? "Base Frequency Drift (Hz)"
                  : activeMetric === "quality_factor"
                  ? "Waveguide Quality Factor (Q)"
                  : "Q-Burst Transient Flux (pT)"}
              </span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              h_D {currentGlobal.mean_d_region_km} KM D/E REGION
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-sky-400">
              {activeMetric === "amplitude"
                ? "15 pT²/Hz"
                : activeMetric === "frequency"
                ? "7.68 Hz"
                : activeMetric === "quality_factor"
                ? "4.0 Q"
                : "10 pT"}
            </span>
            <div className="h-2 w-40 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
            <span className="font-mono text-[10px] text-rose-400">
              {activeMetric === "amplitude"
                ? "95 pT²/Hz"
                : activeMetric === "frequency"
                ? "8.02 Hz"
                : activeMetric === "quality_factor"
                ? "11.5 Q"
                : "100 pT"}
            </span>
          </div>
        </div>

        {/* Quick-Jump Station & Q-Burst Epicenter Strip */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-950/85 p-1.5 backdrop-blur-md">
          {currentGlobal.q_burst_event && (
            <button
              type="button"
              onClick={() =>
                selectQBurstEpicenter(
                  currentGlobal.q_burst_event!.epicenter_lat,
                  currentGlobal.q_burst_event!.epicenter_lng,
                  true
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-bold transition ${
                inspectingQBurst
                  ? "bg-rose-500/30 text-rose-200 border border-rose-400"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
              }`}
            >
              <Crosshair className="h-3 w-3" />
              <span>⚡ Δt SOURCE</span>
            </button>
          )}
          <span className="px-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-400 flex items-center gap-1">
            <Radio className="h-3 w-3 text-cyan-400" />
            Nodes:
          </span>
          {currentRecords.map((rec) => {
            const isSelected = rec.location_id === selectedStationId && !inspectingQBurst;
            return (
              <button
                key={rec.location_id}
                type="button"
                onClick={() => selectStation(rec.location_id, true)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[11px] transition ${
                  isSelected
                    ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: getMetricColor(rec, activeMetric),
                  }}
                />
                <span>{rec.location_id.split("-")[0]}</span>
                {rec.is_q_burst && (
                  <Sparkles className="h-2.5 w-2.5 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
