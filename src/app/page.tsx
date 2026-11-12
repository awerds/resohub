"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
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
  SlidersHorizontal,
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
    // On mobile/tablet viewports (<1024px), start with both drawers collapsed so the 3D WebGL Globe is full-screen
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
    syncLiveClock();
    refreshLiveSpaceWeather();
    const id = setInterval(syncLiveClock, 60_000);
    return () => clearInterval(id);
  }, [
    syncLiveClock,
    refreshLiveSpaceWeather,
    setLeftSidebarOpen,
    setRightSidebarOpen,
  ]);

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

  const isGlobeViewActiveOnMobile = !isLeftSidebarOpen && !isRightSidebarOpen;

  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden bg-[#030712] text-slate-100">
      {/* Top Flight-Control Telemetry Header */}
      <header className="safe-top relative z-40 flex min-h-12 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#040914]/95 px-2.5 py-1.5 backdrop-blur-xl sm:min-h-13 sm:px-4">
        {/* Left: Brand, System Identifier & Left Sidebar Toggle */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)}
            aria-label="Toggle Left Controls Drawer"
            title="Toggle Left Controls Drawer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            )}
          </button>

          <div className="hidden xs:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)] sm:flex">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-mono text-xs font-bold tracking-[0.14em] uppercase text-white sm:text-sm sm:tracking-[0.16em]">
                RESO<span className="text-cyan-400">//</span>EARTH-ELF
              </h1>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-widest text-emerald-300 border border-emerald-500/30 sm:text-[9px]">
                7.83 Hz
              </span>
            </div>
            <p className="hidden sm:block font-mono text-[10px] tracking-wider text-slate-400">
              GLOBAL SCHUMANN RESONANCE & IONOSPHERIC WAVEGUIDE COMMAND
            </p>
          </div>
        </div>

        {/* Center Live Status Ticker */}
        <div className="hidden xl:flex shrink-0 whitespace-nowrap items-center gap-5 rounded-lg border border-slate-800/80 bg-slate-950/70 px-4 py-1 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Waves className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span className="text-slate-400">FUNDAMENTAL:</span>
            <span className="font-bold text-cyan-300">
              {currentGlobal.global_primary_frequency.toFixed(3)} Hz
            </span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-slate-400">ARRAY PSD:</span>
            <span className="font-bold text-emerald-300">
              {currentGlobal.global_amplitude.toFixed(1)} pT²/Hz
            </span>
          </div>
          <span className="text-slate-800">|</span>
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span className="text-slate-400">STATIONS:</span>
            <span className="font-bold text-white">
              {STATIONS.length}/{STATIONS.length} SYNCED
            </span>
          </div>
        </div>

        {/* Right Controls: Guided Tour Button + Data Provenance Badge + Right Inspector Toggle */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setTourTriggerCount((c) => c + 1)}
            aria-label="Open Welcome Mission Briefing & Interactive Guided Tour"
            title="Open Welcome Mission Briefing & Interactive Guided Tour"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 py-1.5 font-mono text-[11px] font-bold text-cyan-200 transition hover:bg-cyan-500/25 sm:px-2.5"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
            <span className="hidden sm:inline">TOUR / GUIDE</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProvenanceModal(!showProvenanceModal)}
              aria-label="Inspect Telemetry Source Adapter & Data Provenance"
              className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 font-mono text-[10px] transition sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
                provenance.mode === "HYBRID_NOAA_LIVE"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
              }`}
              title="Inspect Telemetry Source Adapter & Data Provenance"
            >
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sm:hidden">NOAA</span>
              <span className="hidden sm:inline">
                {provenance.mode === "HYBRID_NOAA_LIVE"
                  ? "PROVENANCE: NOAA SWPC + WAVEGUIDE MODEL"
                  : "PROVENANCE: 72H WAVEGUIDE SIMULATOR"}
              </span>
              <Info className="h-3 w-3 opacity-75" aria-hidden="true" />
            </button>

            {/* Data Provenance Inspector Popover */}
            {showProvenanceModal && (
              <div className="fixed right-2.5 top-13 z-50 w-[min(24rem,calc(100dvw-1.25rem))] rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3.5 font-mono text-xs shadow-2xl backdrop-blur-xl sm:absolute sm:right-0 sm:top-auto sm:mt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">
                    TelemetrySourceAdapter Provenance
                  </span>
                  <button
                    type="button"
                    onClick={() => refreshLiveSpaceWeather()}
                    className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-cyan-300 border border-slate-700 hover:border-cyan-400"
                  >
                    <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" />
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
            aria-label={isRightSidebarOpen ? "Hide Inspector" : "Open Inspector"}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 font-mono text-xs text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300 sm:px-2.5"
          >
            {isRightSidebarOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span className="hidden md:inline">HIDE INSPECTOR</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span className="hidden md:inline">OPEN INSPECTOR</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Center Tri-Pane Workspace: Left Controls | 3D Planetary Viewport | Right Analytics */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <SchumannGlobe />
        </main>
        <RightSidebar />
      </div>

      {/* Persistent Bottom Temporal Navigation Bar */}
      <TimelineBottomPanel />

      {/* Mobile & Tablet Thumb Navigation Bar (<1024px) */}
      <nav
        aria-label="Mobile Workspace Switcher"
        className="safe-bottom relative z-40 grid shrink-0 grid-cols-4 gap-1 border-t border-slate-800/90 bg-[#030712]/98 px-2 pt-1.5 font-mono lg:hidden"
      >
        <button
          type="button"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition ${
            isGlobeViewActiveOnMobile
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          <span>3D Globe</span>
        </button>

        <button
          type="button"
          onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition ${
            isLeftSidebarOpen
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition ${
            isRightSidebarOpen
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          <span>Inspector</span>
        </button>

        <button
          type="button"
          onClick={() => setTourTriggerCount((c) => c + 1)}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent py-1.5 text-[10px] font-bold text-slate-400 transition hover:text-cyan-300"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Tour</span>
        </button>
      </nav>

      {/* Startup Welcome Popup & 6-Step Interactive Guided Tour */}
      <InteractiveTourModal externalTriggerCount={tourTriggerCount} />
    </div>
  );
}
