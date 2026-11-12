"use client";

import React, { useEffect, useMemo } from "react";
import {
  Activity,
  Globe2,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  ShieldCheck,
  Waves,
} from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import SchumannGlobe from "@/components/SchumannGlobe";
import TimelineBottomPanel from "@/components/TimelineBottomPanel";
import { getSchumannDataset, STATIONS } from "@/lib/schumann-data";
import { useResonanceStore } from "@/store/useResonanceStore";

export default function ResonanceDashboardPage() {
  const anchorHourEpochMs = useResonanceStore((s) => s.anchorHourEpochMs);
  const syncLiveClock = useResonanceStore((s) => s.syncLiveClock);
  const timeIndex = useResonanceStore((s) => s.timeIndex);
  const isRightSidebarOpen = useResonanceStore((s) => s.isRightSidebarOpen);
  const setRightSidebarOpen = useResonanceStore((s) => s.setRightSidebarOpen);

  useEffect(() => {
    syncLiveClock();
    const id = setInterval(syncLiveClock, 60_000);
    return () => clearInterval(id);
  }, [syncLiveClock]);

  const dataset = useMemo(
    () => getSchumannDataset(anchorHourEpochMs),
    [anchorHourEpochMs]
  );

  const currentGlobal =
    dataset.globalBaseline[timeIndex] || dataset.globalBaseline[0];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#030712] text-slate-100">
      {/* Top Flight-Control Telemetry Header */}
      <header className="z-30 flex h-13 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#040914]/95 px-4 backdrop-blur-xl">
        {/* Brand & System Identifier */}
        <div className="flex items-center gap-3">
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
        <div className="hidden xl:flex items-center gap-6 rounded-lg border border-slate-800/80 bg-slate-950/70 px-4 py-1 font-mono text-xs">
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
            <span className="text-slate-400">ARRAY POWER:</span>
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

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>D/E WAVEGUIDE NOMINAL</span>
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
    </div>
  );
}
