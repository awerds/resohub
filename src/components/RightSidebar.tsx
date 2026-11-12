"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Compass,
  Crosshair,
  Gauge,
  MapPin,
  Radio,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { getSchumannDataset, STATIONS } from "@/lib/schumann-data";
import { useResonanceStore } from "@/store/useResonanceStore";
import {
  AmplitudeAndQualityWidget,
  FrequencyComparisonWidget,
  QBurstTriangulationWidget,
  SpectrogramWaterfallWidget,
} from "@/components/AnalyticsWidgets";

export default function RightSidebar() {
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
  const polarizationMode = useResonanceStore((s) => s.polarizationMode);
  const isRightSidebarOpen = useResonanceStore((s) => s.isRightSidebarOpen);

  const setRightSidebarOpen = useResonanceStore((s) => s.setRightSidebarOpen);
  const selectStation = useResonanceStore((s) => s.selectStation);
  const selectQBurstEpicenter = useResonanceStore(
    (s) => s.selectQBurstEpicenter
  );
  const setInspectingQBurst = useResonanceStore((s) => s.setInspectingQBurst);
  const setPolarizationMode = useResonanceStore((s) => s.setPolarizationMode);

  // Accordion states for ergonomic layout on smaller laptop screens
  const [sections, setSections] = useState({
    spectrogram: true,
    qburst: true,
    drift: true,
    power: true,
    telemetry: true,
  });

  const toggleSec = (k: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [k]: !prev[k] }));

  const stationHistory = useMemo(() => {
    const id = selectedStationId || "TOMSK-RU";
    return dataset.recordsByStation[id] || dataset.recordsByStation["TOMSK-RU"];
  }, [dataset, selectedStationId]);

  const currentRecord = useMemo(
    () => stationHistory[timeIndex] || stationHistory[0],
    [stationHistory, timeIndex]
  );

  const currentGlobal = useMemo(
    () => dataset.globalBaseline[timeIndex] || dataset.globalBaseline[0],
    [dataset, timeIndex]
  );

  if (!isRightSidebarOpen || !selectedStationId) {
    return (
      <div className="relative z-30 hidden h-full items-start border-l border-slate-800/80 bg-[#050b16]/95 p-2 lg:flex">
        <button
          type="button"
          onClick={() => {
            if (!selectedStationId) selectStation("TOMSK-RU", false);
            setRightSidebarOpen(true);
          }}
          aria-label="Expand Station Analytics & Spectrogram"
          title="Expand Station Analytics & Spectrogram"
          className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-2 py-3 text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/15"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
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
  const activeQBurstEvent = currentGlobal.q_burst_event;

  return (
    <>
      {/* Mobile Backdrop Overlay (Tap outside to dismiss inspector on <1024px) */}
      <div
        aria-hidden="true"
        onClick={() => setRightSidebarOpen(false)}
        className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs lg:hidden"
      />
      <aside
        aria-label="Station Spectrogram and Telemetry Inspector"
        className="fixed inset-y-0 right-0 z-40 flex h-full w-[min(26.5rem,94dvw)] shrink-0 flex-col border-l border-slate-800/80 bg-[#050b16]/98 text-slate-100 shadow-2xl backdrop-blur-xl overflow-y-auto lg:relative lg:inset-auto lg:z-20 lg:w-[415px] lg:bg-[#050b16]/95 lg:shadow-none"
      >
        {/* Header: Station Identification & Coordinates */}
        <div className="sticky top-0 z-20 border-b border-slate-800/90 bg-[#050b16]/95 p-3.5 backdrop-blur-md">
          {/* Mobile Quick Station Switcher Strip inside Inspector */}
          <div className="mb-2.5 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar lg:hidden">
            {STATIONS.map((st) => {
              const active = st.location_id === currentRecord.location_id;
              return (
                <button
                  key={st.location_id}
                  type="button"
                  onClick={() => selectStation(st.location_id, true)}
                  className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition ${
                    active
                      ? "border-cyan-400 bg-cyan-500/25 text-cyan-200"
                      : "border-slate-800 bg-slate-900/80 text-slate-400"
                  }`}
                >
                  {st.location_id.split("-")[0]}
                </button>
              );
            })}
          </div>

          <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                <Radio className="h-3 w-3" />
                {currentRecord.location_id}
              </span>
              {activeQBurstEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setInspectingQBurst(!inspectingQBurst);
                    if (!inspectingQBurst) {
                      selectQBurstEpicenter(
                        activeQBurstEvent.epicenter_lat,
                        activeQBurstEvent.epicenter_lng,
                        true
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border transition ${
                    inspectingQBurst
                      ? "bg-rose-500/30 text-rose-200 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                  }`}
                >
                  <Crosshair className="h-2.5 w-2.5" />
                  <span>
                    Q-BURST Δt +{currentRecord.q_burst_arrival_ms.toFixed(1)}ms
                  </span>
                </button>
              )}
            </div>
            <h2 className="mt-1 truncate font-mono text-sm font-bold text-white">
              {currentRecord.station_name}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-cyan-400" />
                {currentRecord.latitude.toFixed(2)}°N,{" "}
                {currentRecord.longitude.toFixed(2)}°E
              </span>
              <span>ALT {currentRecord.elevation_m}m</span>
              <span className="text-emerald-300">
                {currentRecord.amplitude.toFixed(1)} pT²/Hz
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRightSidebarOpen(false)}
            aria-label="Collapse Analytics Panel"
            title="Collapse Analytics Panel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Instantaneous 5-Harmonic Eigenmode Strip */}
        <div className="mt-2.5 grid grid-cols-5 gap-1 rounded-xl border border-slate-800/90 bg-slate-900/50 p-1.5">
          {[
            {
              label: "f₁ Base",
              val: currentRecord.primary_frequency,
              color: "text-cyan-300",
            },
            {
              label: "f₂ Mode",
              val: currentRecord.harmonic_2,
              color: "text-emerald-300",
            },
            {
              label: "f₃ Mode",
              val: currentRecord.harmonic_3,
              color: "text-amber-300",
            },
            {
              label: "f₄ Mode",
              val: currentRecord.harmonic_4,
              color: "text-sky-300",
            },
            {
              label: "f₅ Mode",
              val: currentRecord.harmonic_5,
              color: "text-rose-300",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center rounded-lg bg-slate-950/70 py-1 px-1 font-mono"
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

      {/* Main Analytics Content Stack with Compact Accordion Toggles */}
      <div className="space-y-2.5 p-3">
        {/* Conditional Top Priority: Q-Burst Geolocation & Arrival Time Delta (Δt) Matrix when inspecting Q-Burst */}
        {(inspectingQBurst || activeQBurstEvent) && (
          <div>
            <button
              type="button"
              onClick={() => toggleSec("qburst")}
              className="mb-1.5 flex w-full items-center justify-between px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-rose-400" />
                Q-Burst Triangulation & Arrival Time (Δt)
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  sections.qburst ? "rotate-180" : ""
                }`}
              />
            </button>
            {sections.qburst && (
              <QBurstTriangulationWidget
                qBurstEvent={activeQBurstEvent}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => selectStation(id, true)}
                onFocusEpicenter={(lat, lng) =>
                  selectQBurstEpicenter(lat, lng, true)
                }
              />
            )}
          </div>
        )}

        {/* Section 1: 2D Waterfall Spectrogram & Vector Polarization PSD */}
        <div>
          <button
            type="button"
            onClick={() => toggleSec("spectrogram")}
            className="mb-1.5 flex w-full items-center justify-between px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300"
          >
            <span>1. Spectrogram & Vector Polarization ({polarizationMode})</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                sections.spectrogram ? "rotate-180" : ""
              }`}
            />
          </button>
          {sections.spectrogram && (
            <SpectrogramWaterfallWidget
              stationHistory={stationHistory}
              currentTimeIndex={timeIndex}
              polarizationMode={polarizationMode}
              onSelectPolarization={setPolarizationMode}
            />
          )}
        </div>

        {/* Section 2: Local Frequency vs. Global Baseline */}
        <div>
          <button
            type="button"
            onClick={() => toggleSec("drift")}
            className="mb-1.5 flex w-full items-center justify-between px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300"
          >
            <span>2. Frequency Drift vs. Global Baseline</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                sections.drift ? "rotate-180" : ""
              }`}
            />
          </button>
          {sections.drift && (
            <FrequencyComparisonWidget
              stationHistory={stationHistory}
              globalBaseline={dataset.globalBaseline}
              currentTimeIndex={timeIndex}
            />
          )}
        </div>

        {/* Section 3: Amplitude PSD & Cavity Quality Factor */}
        <div>
          <button
            type="button"
            onClick={() => toggleSec("power")}
            className="mb-1.5 flex w-full items-center justify-between px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300"
          >
            <span>3. Amplitude PSD (pT²/Hz) & Cavity Q-Factor</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                sections.power ? "rotate-180" : ""
              }`}
            />
          </button>
          {sections.power && (
            <AmplitudeAndQualityWidget
              stationHistory={stationHistory}
              globalBaseline={dataset.globalBaseline}
              currentTimeIndex={timeIndex}
            />
          )}
        </div>

        {/* Section 4: Detailed Atmospheric, Ionospheric & D-Region Coupled Telemetry */}
        <div>
          <button
            type="button"
            onClick={() => toggleSec("telemetry")}
            className="mb-1.5 flex w-full items-center justify-between px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300"
          >
            <span>4. Coupled D-Region & Ionospheric Telemetry</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                sections.telemetry ? "rotate-180" : ""
              }`}
            />
          </button>

          {sections.telemetry && (
            <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-cyan-400" />
                  <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
                    Waveguide & Atmospheric State
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">
                  Φ {(currentRecord.phase_coherence * 100).toFixed(0)}% COHERENCE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>D-REGION BOUNDARY</span>
                    <Activity className="h-3 w-3 text-cyan-400" />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-100">
                      {meta.ionospheric_cavity_height_km}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        km
                      </span>
                    </span>
                    <span
                      className={`text-[10px] ${
                        meta.d_region_compression_km > 6
                          ? "text-rose-400 font-semibold"
                          : "text-cyan-400"
                      }`}
                      title="Downward D-region boundary compression coupled to Kp & solar ionization"
                    >
                      Δ -{meta.d_region_compression_km}km
                    </span>
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
                    <span>SOLAR WIND (L1)</span>
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
                    <span className="text-[10px] font-normal text-slate-400">
                      nT
                    </span>
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
                  <span className="text-slate-300">
                    {currentRecord.sensor_type}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-500">OBSERVATORY:</span>
                  <span className="text-slate-300">
                    {currentRecord.institution}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}
