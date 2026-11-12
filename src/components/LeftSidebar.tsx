"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Flame,
  Gauge,
  Layers,
  Radio,
  Radar,
  Waves,
  Zap,
} from "lucide-react";
import {
  getSchumannDataset,
  PolarizationMode,
} from "@/lib/schumann-data";
import {
  GlobeLayerState,
  HarmonicMode,
  MetricMode,
  useResonanceStore,
} from "@/store/useResonanceStore";

const METRIC_OPTIONS: Array<{
  id: MetricMode;
  label: string;
  sublabel: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    id: "amplitude",
    label: "Amplitude Power",
    sublabel: "Power Spectral Density",
    unit: "pT²/Hz",
    icon: Flame,
    accent: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  },
  {
    id: "frequency",
    label: "Base Frequency [7.83 Hz]",
    sublabel: "Fundamental & Eigenmode Drift",
    unit: "Hz",
    icon: Waves,
    accent: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  },
  {
    id: "quality_factor",
    label: "Quality Factor (Q)",
    sublabel: "Waveguide Cavity Efficiency",
    unit: "Q-Factor",
    icon: Gauge,
    accent: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  },
  {
    id: "q_burst",
    label: "Q-Burst Transients",
    sublabel: "Global Super-Bolt Discharges",
    unit: "pT Peak",
    icon: Zap,
    accent: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  },
];

const HARMONIC_MODES: Array<{
  mode: HarmonicMode;
  nominal: string;
  label: string;
}> = [
  { mode: 1, nominal: "7.83 Hz", label: "Mode 1 (Fundamental)" },
  { mode: 2, nominal: "14.3 Hz", label: "Mode 2 (Second)" },
  { mode: 3, nominal: "20.8 Hz", label: "Mode 3 (Third)" },
  { mode: 4, nominal: "27.3 Hz", label: "Mode 4 (Fourth)" },
  { mode: 5, nominal: "33.8 Hz", label: "Mode 5 (Fifth)" },
];

const POLARIZATION_MODES: Array<{
  id: PolarizationMode;
  label: string;
  desc: string;
}> = [
  { id: "TOTAL", label: "B_total", desc: "Scalar Horizontal Mag PSD" },
  { id: "H_NS", label: "H_NS", desc: "North-South Coil (B_NS)" },
  { id: "H_EW", label: "H_EW", desc: "East-West Coil (B_EW)" },
  { id: "DUAL_H", label: "H_NS + H_EW", desc: "Dual Orthogonal Overlay" },
  { id: "E_R", label: "E_r", desc: "Radial Vertical Whip (mV²/m²/Hz)" },
];

const LAYER_CONTROLS: Array<{
  key: keyof GlobeLayerState;
  label: string;
  desc: string;
}> = [
  {
    key: "showIonosphericHeatmap",
    label: "Ionospheric Cavity Heatmap",
    desc: "3D D/E-region waveguide mesh & intensity grid",
  },
  {
    key: "showStationNodes",
    label: "Discrete Sensor Stations",
    desc: "3D ELF magnetometer beacons & HUD telemetry tags",
  },
  {
    key: "showQBurstRings",
    label: "Q-Burst Shockwave Rings",
    desc: "Clickable super-bolt epicenter & propagation rings",
  },
  {
    key: "showCoherenceArcs",
    label: "Phase Coherence Links",
    desc: "Inter-station standing wave phase synchronization",
  },
  {
    key: "showAtmosphereGlow",
    label: "Magnetospheric Limb Halo",
    desc: "Upper atmospheric optical boundary glow",
  },
];

export default function LeftSidebar() {
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
  const activeMetric = useResonanceStore((s) => s.activeMetric);
  const selectedHarmonic = useResonanceStore((s) => s.selectedHarmonic);
  const polarizationMode = useResonanceStore((s) => s.polarizationMode);
  const layers = useResonanceStore((s) => s.layers);
  const selectedStationId = useResonanceStore((s) => s.selectedStationId);
  const isLeftSidebarOpen = useResonanceStore((s) => s.isLeftSidebarOpen);

  const setActiveMetric = useResonanceStore((s) => s.setActiveMetric);
  const setSelectedHarmonic = useResonanceStore((s) => s.setSelectedHarmonic);
  const setPolarizationMode = useResonanceStore((s) => s.setPolarizationMode);
  const toggleLayer = useResonanceStore((s) => s.toggleLayer);
  const selectStation = useResonanceStore((s) => s.selectStation);
  const setLeftSidebarOpen = useResonanceStore((s) => s.setLeftSidebarOpen);

  // Compact accordion section states so laptop viewports never bury controls
  const [openSections, setOpenSections] = useState({
    metric: true,
    eigenmode: true,
    layers: true,
    stations: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentRecords = useMemo(
    () => dataset.recordsByTime[timeIndex] || dataset.recordsByTime[0],
    [dataset, timeIndex]
  );

  if (!isLeftSidebarOpen) {
    return (
      <div className="relative z-30 hidden h-full items-start border-r border-slate-800/80 bg-[#050b16]/95 p-2 lg:flex">
        <button
          type="button"
          onClick={() => setLeftSidebarOpen(true)}
          aria-label="Expand Layer & Sensor Controls"
          title="Expand Layer & Sensor Controls"
          className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-2 py-3 text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/15"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            Layers & Array
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Backdrop Overlay (Tap outside to dismiss drawer on <1024px) */}
      <div
        aria-hidden="true"
        onClick={() => setLeftSidebarOpen(false)}
        className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs lg:hidden"
      />
      <aside
        aria-label="Waveguide and Sensor Controls"
        className="fixed inset-y-0 left-0 z-40 flex h-full w-[min(21rem,88dvw)] shrink-0 flex-col border-r border-slate-800/80 bg-[#050b16]/98 text-slate-100 shadow-2xl backdrop-blur-xl overflow-y-auto lg:relative lg:inset-auto lg:z-20 lg:w-80 lg:bg-[#050b16]/95 lg:shadow-none"
      >
        {/* Drawer Header with Collapse Toggle */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/90 bg-[#050b16]/95 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Radar className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-slate-200">
              Waveguide Controls
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(false)}
            aria-label="Collapse Controls Sidebar"
            title="Collapse Controls Sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

      {/* Section 1: Telemetry Parameter Mode */}
      <div className="border-b border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => toggleSection("metric")}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-cyan-400" />
            <h2 className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-slate-200">
              Primary Visualization
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 border border-cyan-500/30">
              ELF 3–45 Hz
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                openSections.metric ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.metric && (
          <div className="mt-2.5 grid grid-cols-1 gap-1.5">
            {METRIC_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = activeMetric === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveMetric(opt.id)}
                  className={`group flex items-center justify-between rounded-xl border p-2 text-left transition ${
                    active
                      ? `${opt.accent} shadow-[0_0_20px_rgba(6,182,212,0.12)]`
                      : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                        active
                          ? "border-current bg-slate-950/60"
                          : "border-slate-800 bg-slate-950 text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold leading-tight">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase opacity-80">
                    {opt.unit}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Schumann Harmonic Eigenmodes & Vector Polarization */}
      <div className="border-b border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => toggleSection("eigenmode")}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <h2 className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-slate-200">
              Eigenmode & Polarization
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-cyan-300">
              f{selectedHarmonic} · {polarizationMode}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                openSections.eigenmode ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.eigenmode && (
          <div className="mt-2.5 space-y-2.5">
            <div className="grid grid-cols-5 gap-1">
              {HARMONIC_MODES.map((h) => {
                const isSelected = selectedHarmonic === h.mode;
                return (
                  <button
                    key={h.mode}
                    type="button"
                    onClick={() => setSelectedHarmonic(h.mode)}
                    title={h.label}
                    className={`flex flex-col items-center justify-center rounded-lg border py-1.5 px-1 font-mono transition ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                        : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold">f{h.mode}</span>
                    <span className="text-[9px] text-cyan-300/90">
                      {h.nominal.replace(" Hz", "")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Vector Field Polarization Selector (H_NS vs H_EW vs E_r) */}
            <div>
              <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Compass className="h-2.5 w-2.5 text-cyan-400" />
                  TM₀ Field Polarization Vector
                </span>
                <span className="text-slate-500">N-S / E-W / E_r</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {POLARIZATION_MODES.map((p) => {
                  const active = polarizationMode === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPolarizationMode(p.id)}
                      title={p.desc}
                      className={`rounded-md border py-1 px-1 font-mono text-[9px] font-semibold transition ${
                        active
                          ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: 3D Globe Visual Overlays & Layers */}
      <div className="border-b border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => toggleSection("layers")}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <h2 className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-slate-200">
              Planetary Layers
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                openSections.layers ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.layers && (
          <div className="mt-2.5 space-y-1.5">
            {LAYER_CONTROLS.map((layer) => {
              const enabled = layers[layer.key];
              return (
                <label
                  key={layer.key}
                  className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-2 transition ${
                    enabled
                      ? "border-slate-700/90 bg-slate-900/75"
                      : "border-slate-800/50 bg-slate-950/40 opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-medium text-slate-200 leading-tight">
                      {layer.label}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {layer.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleLayer(layer.key)}
                    className="h-4 w-4 rounded border-slate-700 accent-cyan-400 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: Global Observatory Array Roster */}
      <div className="flex-1 p-3">
        <button
          type="button"
          onClick={() => toggleSection("stations")}
          className="mb-2.5 flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <h2 className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-slate-200">
              Sensor Array ({currentRecords.length})
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-emerald-400">
              ● ONLINE
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                openSections.stations ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.stations && (
          <div className="space-y-1.5">
            {currentRecords.map((rec) => {
              const isSelected = rec.location_id === selectedStationId;
              const pctPower = Math.min(
                100,
                Math.round((rec.amplitude / 95) * 100)
              );

              return (
                <button
                  key={rec.location_id}
                  type="button"
                  onClick={() => selectStation(rec.location_id, true)}
                  className={`w-full rounded-xl border p-2 text-left transition ${
                    isSelected
                      ? "border-cyan-400/60 bg-cyan-950/35 shadow-[0_0_16px_rgba(34,211,238,0.14)]"
                      : "border-slate-800/80 bg-slate-900/35 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          rec.is_q_burst
                            ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                            : isSelected
                            ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="font-mono text-xs font-bold text-slate-100">
                        {rec.location_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {rec.is_q_burst && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-300 border border-rose-500/40">
                          Q-BURST
                        </span>
                      )}
                      <span className="font-mono text-xs font-semibold text-cyan-300">
                        {rec.primary_frequency.toFixed(2)} Hz
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">
                      h_D {rec.metadata.ionospheric_cavity_height_km} km ·{" "}
                      {rec.region}
                    </span>
                    <span className="font-mono text-slate-300 shrink-0 ml-1">
                      {rec.amplitude.toFixed(1)} pT²/Hz
                    </span>
                  </div>

                  {/* Mini amplitude power bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rec.is_q_burst
                          ? "bg-gradient-to-r from-amber-400 to-rose-500"
                          : "bg-gradient-to-r from-cyan-400 to-emerald-400"
                      }`}
                      style={{ width: `${pctPower}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
