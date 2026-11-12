"use client";

import React, { useMemo } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Compass,
  Cpu,
  Droplets,
  Gauge,
  MapPin,
  Radio,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { getSchumannDataset } from "@/lib/schumann-data";
import { useResonanceStore } from "@/store/useResonanceStore";
import {
  AmplitudeAndQualityWidget,
  FrequencyComparisonWidget,
  SpectrogramWaterfallWidget,
} from "@/components/AnalyticsWidgets";

export default function RightSidebar() {
  const anchorHourEpochMs = useResonanceStore((s) => s.anchorHourEpochMs);
  const dataset = useMemo(
    () => getSchumannDataset(anchorHourEpochMs),
    [anchorHourEpochMs]
  );

  const timeIndex = useResonanceStore((s) => s.timeIndex);
  const selectedStationId = useResonanceStore((s) => s.selectedStationId);
  const isRightSidebarOpen = useResonanceStore((s) => s.isRightSidebarOpen);
  const setRightSidebarOpen = useResonanceStore((s) => s.setRightSidebarOpen);
  const selectStation = useResonanceStore((s) => s.selectStation);

  const stationHistory = useMemo(() => {
    const id = selectedStationId || "TOMSK-RU";
    return dataset.recordsByStation[id] || dataset.recordsByStation["TOMSK-RU"];
  }, [dataset, selectedStationId]);

  const currentRecord = useMemo(
    () => stationHistory[timeIndex] || stationHistory[0],
    [stationHistory, timeIndex]
  );

  // Collapsed state toggle handle
  if (!isRightSidebarOpen || !selectedStationId) {
    return (
      <div className="relative z-30 flex h-full items-start border-l border-slate-800/80 bg-[#050b16]/95 p-2">
        <button
          type="button"
          onClick={() => {
            if (!selectedStationId) selectStation("TOMSK-RU", false);
            setRightSidebarOpen(true);
          }}
          title="Expand Station Analytics & Spectrogram"
          className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-2 py-3 text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/15"
        >
          <ChevronLeft className="h-4 w-4" />
          <span
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            Node Telemetry
          </span>
        </button>
      </div>
    );
  }

  const meta = currentRecord.metadata;

  return (
    <aside className="flex h-full w-[410px] shrink-0 flex-col border-l border-slate-800/80 bg-[#050b16]/95 text-slate-100 backdrop-blur-xl overflow-y-auto">
      {/* Header: Station Identification & Coordinates */}
      <div className="sticky top-0 z-20 border-b border-slate-800/90 bg-[#050b16]/95 p-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                <Radio className="h-3 w-3" />
                {currentRecord.location_id}
              </span>
              {currentRecord.is_q_burst && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 border border-rose-500/40 animate-pulse">
                  <Sparkles className="h-2.5 w-2.5" />
                  Q-BURST EVENT
                </span>
              )}
            </div>
            <h2 className="mt-1.5 truncate font-mono text-sm font-bold text-white">
              {currentRecord.station_name}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-cyan-400" />
                {currentRecord.latitude.toFixed(2)}°N,{" "}
                {currentRecord.longitude.toFixed(2)}°E
              </span>
              <span>ALT {currentRecord.elevation_m}m</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRightSidebarOpen(false)}
            title="Collapse Analytics Panel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Instantaneous 5-Harmonic Eigenmode Strip */}
        <div className="mt-3 grid grid-cols-5 gap-1.5 rounded-xl border border-slate-800/90 bg-slate-900/50 p-2">
          {[
            { label: "f₁ Base", val: currentRecord.primary_frequency, color: "text-cyan-300" },
            { label: "f₂ Mode", val: currentRecord.harmonic_2, color: "text-emerald-300" },
            { label: "f₃ Mode", val: currentRecord.harmonic_3, color: "text-amber-300" },
            { label: "f₄ Mode", val: currentRecord.harmonic_4, color: "text-sky-300" },
            { label: "f₅ Mode", val: currentRecord.harmonic_5, color: "text-rose-300" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center rounded-lg bg-slate-950/70 py-1.5 px-1 font-mono"
            >
              <span className="text-[9px] uppercase text-slate-400">
                {m.label}
              </span>
              <span className={`text-xs font-bold ${m.color}`}>
                {m.val.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500">Hz</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Analytics Content Stack */}
      <div className="space-y-3.5 p-4">
        {/* Widget 1: 2D Waterfall Spectrogram & Harmonic PSD */}
        <SpectrogramWaterfallWidget
          stationHistory={stationHistory}
          currentTimeIndex={timeIndex}
        />

        {/* Widget 2: Local Frequency vs. Global Baseline */}
        <FrequencyComparisonWidget
          stationHistory={stationHistory}
          globalBaseline={dataset.globalBaseline}
          currentTimeIndex={timeIndex}
        />

        {/* Widget 3: Amplitude Power & Cavity Quality Factor */}
        <AmplitudeAndQualityWidget
          stationHistory={stationHistory}
          globalBaseline={dataset.globalBaseline}
          currentTimeIndex={timeIndex}
        />

        {/* Widget 4: Detailed Atmospheric, Ionospheric & Meteorological Metadata */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
                Ionospheric & Atmospheric Telemetry
              </h3>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">
              Φ {(currentRecord.phase_coherence * 100).toFixed(0)}% COHERENCE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>D/E CAVITY ALTITUDE</span>
                <Activity className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-100">
                {meta.ionospheric_cavity_height_km}{" "}
                <span className="text-[10px] font-normal text-slate-400">km</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>LIGHTNING EXCITATION</span>
                <CloudLightning className="h-3 w-3 text-amber-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-amber-300">
                {meta.local_lightning_flashes_min}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  fl/min
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>SOLAR WIND VELOCITY</span>
                <Sun className="h-3 w-3 text-rose-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-100">
                {meta.solar_wind_kms}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  km/s
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>LOCAL B-FIELD FLUX</span>
                <Gauge className="h-3 w-3 text-sky-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-sky-300">
                {meta.b_field_nt.toLocaleString()}{" "}
                <span className="text-[10px] font-normal text-slate-400">nT</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>SURFACE TEMP / RH</span>
                <Thermometer className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-100">
                {meta.ambient_temp_c}°C{" "}
                <span className="text-xs font-normal text-slate-400">
                  / {meta.humidity_pct}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>BAROMETRIC PRESSURE</span>
                <Wind className="h-3 w-3 text-indigo-400" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-100">
                {meta.barometric_hpa}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  hPa
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 rounded-lg border border-slate-800/70 bg-slate-900/30 px-2.5 py-2 font-mono text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">INSTRUMENT:</span>
              <span className="text-slate-300">{currentRecord.sensor_type}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-slate-500">OBSERVATORY:</span>
              <span className="text-slate-300">{currentRecord.institution}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

