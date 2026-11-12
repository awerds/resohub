"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Database,
  Globe2,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  RefreshCw,
  Waves,
} from "lucide-react";
import InteractiveTourModal from "@/components/InteractiveTourModal";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import SchumannGlobe from "@/components/SchumannGlobe";
import TimelineBottomPanel from "@/components/TimelineBottomPanel";
import { getSchumannDataset, STATIONS } from "@/lib/schumann-data";
import { useResonanceStore } from "@/store/useResonanceStore";

export default function ResonanceDashboardPage() {
  const anchorHourEpochMs = useResonanceStore((s) => s.anchorHourEpochMs);
  const provenance = useResonanceStore((s) => s.provenance);
  const syncLiveClock = useResonanceStore((s) => s.syncLiveClock);
  const refreshLiveSpaceWeather = useResonanceStore(
    (s) => s.refreshLiveSpaceWeather
  );
  const timeIndex = useResonanceStore((s) => s.timeIndex);
  const isLeftSidebarOpen = useResonanceStore((s) => s.isLeftSidebarOpen);
  const isRightSidebarOpen = useResonanceStore((s) => s.isRightSidebarOpen);
  const setLeftSidebarOpen = useResonanceStore((s) => s.setLeftSidebarOpen);
  const setRightSidebarOpen = useResonanceStore((s) => s.setRightSidebarOpen);

  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [tourTriggerCount, setTourTriggerCount] = useState(0);

  useEffect(() => {
    syncLiveClock();
    refreshLiveSpaceWeather();
    const id = setInterval(syncLiveClock, 60_000);
    return () => clearInterval(id);
  }, [syncLiveClock, refreshLiveSpaceWeather]);

  const dataset = useMemo(
    () =>
      getSchumannDataset(
        anchorHourEpochMs,
        provenance.liveOverridesByHourEpoch
      ),
    [anchorHourEpochMs, provenance.liveOverridesByHourEpoch]
  );

  const currentGlobal =
    dataset.globalBaseline[timeIndex] || dataset.globalBaseline[0];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#030712] text-slate-100">
      {/* Top Flight-Control Telemetry Header */}
      <header className="relative z-40 flex h-13 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#040914]/95 px-4 backdrop-blur-xl">
        {/* Left: Brand, System Identifier & Left Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)}
            title="Toggle Left Controls Drawer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-cyan-400" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-cyan-400" />
            )}
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-bold tracking-[0.16em] uppercase text-white">
                RESO<span className="text-cyan-400">//</span>EARTH-ELF
              </h1>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-emerald-300 border border-emerald-500/30">
                CAVITY LOCK 7.83 Hz
              </span>
            </div>
            <p className="font-mono text-[10px] tracking-wider text-slate-400">
              GLOBAL SCHUMANN RESONANCE & IONOSPHERIC WAVEGUIDE COMMAND
            </p>
          </div>
        </div>

        {/* Center Live Status Ticker */}
        <div className="hidden xl:flex items-center gap-5 rounded-lg border border-slate-800/80 bg-slate-950/70 px-4 py-1 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">FUNDAMENTAL:</span>
            <span className="font-bold text-cyan-300">
              {currentGlobal.global_primary_frequency.toFixed(3)} Hz
            </span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">ARRAY PSD:</span>
            <span className="font-bold text-emerald-300">
              {currentGlobal.global_amplitude.toFixed(1)} pT²/Hz
            </span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-slate-400">STATIONS:</span>
            <span className="font-bold text-white">
              {STATIONS.length}/{STATIONS.length} SYNCED
            </span>
          </div>
        </div>

        {/* Right Controls: Guided Tour Button + Data Provenance Badge + Right Inspector Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTourTriggerCount((c) => c + 1)}
            title="Open Welcome Mission Briefing & Interactive Guided Tour"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1.5 font-mono text-[11px] font-bold text-cyan-200 transition hover:bg-cyan-500/25"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden sm:inline">TOUR / GUIDE</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProvenanceModal(!showProvenanceModal)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition ${
                provenance.mode === "HYBRID_NOAA_LIVE"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
              }`}
              title="Inspect Telemetry Source Adapter & Data Provenance"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {provenance.mode === "HYBRID_NOAA_LIVE"
                  ? "PROVENANCE: NOAA SWPC + WAVEGUIDE MODEL"
                  : "PROVENANCE: 72H WAVEGUIDE SIMULATOR"}
              </span>
              <Info className="h-3 w-3 opacity-75" />
            </button>

            {/* Data Provenance Inspector Popover */}
            {showProvenanceModal && (
              <div className="absolute right-0 mt-2 w-96 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3.5 font-mono text-xs shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">
                    TelemetrySourceAdapter Provenance
                  </span>
                  <button
                    type="button"
                    onClick={() => refreshLiveSpaceWeather()}
                    className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-cyan-300 border border-slate-700 hover:border-cyan-400"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>SYNC NOAA</span>
                  </button>
                </div>
                <div className="mt-2.5 space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      ADAPTER MODE:
                    </span>
                    <span className="font-bold text-white">
                      {provenance.mode === "HYBRID_NOAA_LIVE"
                        ? "HYBRID (Live NOAA SWPC Satellite + Coupled Spherical Waveguide)"
                        : "SYNTHETIC (Deterministic 72h Spherical Waveguide Simulator)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      PLANETARY Kp-INDEX SOURCE:
                    </span>
                    <span className="text-emerald-300">{provenance.kpSource}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      L1 SOLAR WIND SOURCE:
                    </span>
                    <span className="text-sky-300">
                      {provenance.solarWindSource}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      ELF EIGENMODES (f₁–f₅) & D-REGION SOLVER:
                    </span>
                    <span className="text-amber-300">
                      {provenance.elfSpectraSource}
                    </span>
                  </div>
                  {provenance.lastSyncedUtc && (
                    <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                      Last NOAA SWPC Ingest:{" "}
                      {provenance.lastSyncedUtc.slice(0, 19).replace("T", " ")}{" "}
                      UTC (
                      {
                        Object.keys(provenance.liveOverridesByHourEpoch).length
                      }{" "}
                      hourly frames coupled)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
          >
            {isRightSidebarOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden md:inline">HIDE INSPECTOR</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden md:inline">OPEN INSPECTOR</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Center Tri-Pane Workspace: Left Controls | 3D Planetary Viewport | Right Analytics */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <SchumannGlobe />
        </main>
        <RightSidebar />
      </div>

      {/* Persistent Bottom Temporal Navigation Bar */}
      <TimelineBottomPanel />

      {/* Startup Welcome Popup & 6-Step Interactive Guided Tour */}
      <InteractiveTourModal externalTriggerCount={tourTriggerCount} />
    </div>
  );
}
