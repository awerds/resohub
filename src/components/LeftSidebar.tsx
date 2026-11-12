"use client";

import React, { useMemo } from "react";
import {
  Activity,
  Cpu,
  Eye,
  Flame,
  Gauge,
  Globe,
  Layers,
  Radio,
  Radar,
  ShieldAlert,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { getSchumannDataset } from "@/lib/schumann-data";
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
    sublabel: "Spectral Density Intensity",
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
    desc: "Radial electromagnetic propagation ripples",
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
  const dataset = useMemo(
    () => getSchumannDataset(anchorHourEpochMs),
    [anchorHourEpochMs]
  );
  const timeIndex = useResonanceStore((s) => s.timeIndex);
  const activeMetric = useResonanceStore((s) => s.activeMetric);
  const selectedHarmonic = useResonanceStore((s) => s.selectedHarmonic);
  const layers = useResonanceStore((s) => s.layers);
  const selectedStationId = useResonanceStore((s) => s.selectedStationId);

  const setActiveMetric = useResonanceStore((s) => s.setActiveMetric);
  const setSelectedHarmonic = useResonanceStore((s) => s.setSelectedHarmonic);
  const toggleLayer = useResonanceStore((s) => s.toggleLayer);
  const selectStation = useResonanceStore((s) => s.selectStation);

  const currentRecords = useMemo(
    () => dataset.recordsByTime[timeIndex] || dataset.recordsByTime[0],
    [dataset, timeIndex]
  );

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-800/80 bg-[#050b16]/95 text-slate-100 backdrop-blur-xl overflow-y-auto">
      {/* Section 1: Telemetry Parameter Mode */}
      <div className="border-b border-slate-800/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-cyan-400" />
            <h2 className="font-mono text-xs font-bold tracking-[0.18em] uppercase text-slate-200">
              Primary Visualization
            </h2>
          </div>
          <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/30">
            ELF 3–45 Hz
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {METRIC_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = activeMetric === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveMetric(opt.id)}
                className={`group flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                  active
                    ? `${opt.accent} shadow-[0_0_20px_rgba(6,182,212,0.12)]`
                    : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      active
                        ? "border-current bg-slate-950/60"
                        : "border-slate-800 bg-slate-950 text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-semibold">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {opt.sublabel}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase opacity-75">
                  {opt.unit}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Schumann Harmonic Eigenmodes */}
      <div className="border-b border-slate-800/80 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h2 className="font-mono text-xs font-bold tracking-[0.18em] uppercase text-slate-200">
              Harmonic Eigenmode
            </h2>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            n = {selectedHarmonic}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {HARMONIC_MODES.map((h) => {
            const isSelected = selectedHarmonic === h.mode;
            return (
              <button
                key={h.mode}
                type="button"
                onClick={() => setSelectedHarmonic(h.mode)}
                title={h.label}
                className={`flex flex-col items-center justify-center rounded-lg border py-2 px-1 font-mono transition ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span className="text-[10px] font-bold">f{h.mode}</span>
                <span className="text-[10px] text-cyan-300/90">
                  {h.nominal.replace(" Hz", "")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: 3D Globe Visual Overlays & Layers */}
      <div className="border-b border-slate-800/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <h2 className="font-mono text-xs font-bold tracking-[0.18em] uppercase text-slate-200">
              Planetary Layers
            </h2>
          </div>
          <Eye className="h-3.5 w-3.5 text-slate-500" />
        </div>

        <div className="space-y-2">
          {LAYER_CONTROLS.map((layer) => {
            const enabled = layers[layer.key];
            return (
              <label
                key={layer.key}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-2.5 transition ${
                  enabled
                    ? "border-slate-700/90 bg-slate-900/75"
                    : "border-slate-800/50 bg-slate-950/40 opacity-65 hover:opacity-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs font-medium text-slate-200">
                    {layer.label}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
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
      </div>

      {/* Section 4: Global Observatory Array Roster */}
      <div className="flex-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-amber-400" />
            <h2 className="font-mono text-xs font-bold tracking-[0.18em] uppercase text-slate-200">
              Sensor Array ({currentRecords.length})
            </h2>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">
            ● ONLINE
          </span>
        </div>

        <div className="space-y-1.5">
          {currentRecords.map((rec) => {
            const isSelected = rec.location_id === selectedStationId;
            const pctPower = Math.min(100, Math.round((rec.amplitude / 95) * 100));

            return (
              <button
                key={rec.location_id}
                type="button"
                onClick={() => selectStation(rec.location_id, true)}
                className={`w-full rounded-xl border p-2.5 text-left transition ${
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

                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">{rec.region}</span>
                  <span className="font-mono text-slate-300">
                    {rec.amplitude.toFixed(1)} pT²
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
      </div>
    </aside>
  );
}

