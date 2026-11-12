"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Clock,
  FastForward,
  Flame,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { getSchumannDataset, TOTAL_TIME_STEPS } from "@/lib/schumann-data";
import { useResonanceStore } from "@/store/useResonanceStore";

const EVENT_PRESETS = [
  { label: "Baseline Quiet", index: 12, tag: "NOMINAL" },
  { label: "Solar Q-Surge α", index: 24, tag: "Q-BURST" },
  { label: "Equatorial Peak", index: 38, tag: "CHIMNEY" },
  { label: "Super-Bolt Storm β", index: 55, tag: "MAX FLUX" },
  { label: "Live Telemetry", index: TOTAL_TIME_STEPS - 1, tag: "LIVE" },
];

export default function TimelineBottomPanel() {
  const sliderRef = useRef<HTMLInputElement | null>(null);
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
  const isPlaying = useResonanceStore((s) => s.isPlaying);
  const playbackSpeed = useResonanceStore((s) => s.playbackSpeed);

  const setTimeIndex = useResonanceStore((s) => s.setTimeIndex);
  const stepTime = useResonanceStore((s) => s.stepTime);
  const togglePlay = useResonanceStore((s) => s.togglePlay);
  const setPlaybackSpeed = useResonanceStore((s) => s.setPlaybackSpeed);

  const currentGlobal =
    dataset.globalBaseline[timeIndex] || dataset.globalBaseline[0];

  // Sync CSS custom properties on the native range input per modern-web-guidance `slider`
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.style.setProperty("--attr-min", slider.min || "0");
    slider.style.setProperty(
      "--attr-max",
      slider.max || String(TOTAL_TIME_STEPS - 1)
    );
    slider.style.setProperty("--control-value", String(timeIndex));
  }, [timeIndex]);

  // Time-lapse playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(700 / playbackSpeed);
    const timer = setInterval(() => {
      setTimeIndex((prev) => (prev + 1) % TOTAL_TIME_STEPS);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, setTimeIndex]);

  const formattedUtc = useMemo(() => {
    const iso = currentGlobal.timestamp;
    return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
  }, [currentGlobal.timestamp]);

  const hoursAgo = TOTAL_TIME_STEPS - 1 - timeIndex;

  return (
    <footer className="relative z-30 flex flex-col gap-1.5 border-t border-slate-800/90 bg-[#040914]/95 px-2.5 py-2 text-slate-100 backdrop-blur-xl md:gap-2 md:px-5 md:py-3">
      {/* Top Row: Playback Controls + Timestamp Readout + Event Presets */}
      <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
        {/* Transport Controls + Active Timestamp Row */}
        <div className="flex items-center justify-between gap-2 md:justify-start">
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => stepTime(-1)}
              aria-label="Step Back 1 Hour"
              title="Step Back 1 Hour"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 md:h-8 md:w-8"
            >
              <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className={`flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 font-mono text-[11px] font-bold tracking-wider uppercase transition md:h-8 md:gap-1.5 md:px-3.5 md:text-xs ${
                isPlaying
                  ? "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                  : "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 shrink-0 fill-current md:h-3.5 md:w-3.5" aria-hidden="true" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 shrink-0 fill-current md:h-3.5 md:w-3.5" aria-hidden="true" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => stepTime(1)}
              aria-label="Step Forward 1 Hour"
              title="Step Forward 1 Hour"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 md:h-8 md:w-8"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {/* Speed selector */}
            <div className="flex shrink-0 items-center whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 font-mono text-[10px] md:ml-1 md:text-[11px]">
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`whitespace-nowrap rounded-md px-1.5 py-0.5 transition md:px-2 ${
                    playbackSpeed === spd
                      ? "bg-cyan-500/25 text-cyan-300 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Active Timestamp & Offset Badge */}
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-800/90 bg-slate-950/90 px-2 py-1 font-mono md:gap-2.5 md:px-3.5 md:py-1.5">
            <Clock className="hidden sm:inline h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <label
              htmlFor="temporal-scrubber"
              className="text-[11px] font-bold tracking-wider text-white cursor-pointer md:text-xs"
            >
              <span className="sm:hidden">{formattedUtc.slice(5)}</span>
              <span className="hidden sm:inline">{formattedUtc}</span>
            </label>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold md:text-[10px] ${
                hoursAgo === 0
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-cyan-300"
              }`}
            >
              {hoursAgo === 0
                ? provenance.mode === "HYBRID_NOAA_LIVE"
                  ? "NOW · NOAA"
                  : "NOW · MODEL"
                : `T-${hoursAgo}H`}
            </span>
          </div>
        </div>

        {/* Quick Historical Event Bookmarks (Single-row touch scroll on mobile, wrapped on md+) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap">
          {EVENT_PRESETS.map((ev) => {
            const active = timeIndex === ev.index;
            return (
              <button
                key={ev.label}
                type="button"
                onClick={() => setTimeIndex(ev.index)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[10px] transition md:px-2.5 md:text-[11px] ${
                  active
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-800/90 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span>{ev.label}</span>
                <span className="rounded bg-slate-950/80 px-1 py-0.2 text-[9px] text-cyan-400">
                  {ev.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: 72-Hour Resonance Sparkline Bar Backdrop + Native Range Scrubber */}
      <div className="relative flex flex-col">
        {/* Background Sparkline Bars showing Global Power & Q-Bursts across all 72 hours */}
        <div className="pointer-events-none absolute inset-x-1 top-1 bottom-2 flex items-end justify-between gap-[2px] opacity-65">
          {dataset.globalBaseline.map((pt) => {
            const heightPct = Math.max(
              15,
              Math.min(100, ((pt.global_amplitude - 18) / 58) * 100)
            );
            const isCurrent = pt.timeIndex === timeIndex;
            const hasQBurst = pt.active_q_bursts >= 2;

            return (
              <div
                key={pt.timeIndex}
                className="flex-1 rounded-t-xs transition-all"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isCurrent
                    ? "#22d3ee"
                    : hasQBurst
                    ? "rgba(244, 63, 94, 0.65)"
                    : pt.timeIndex < timeIndex
                    ? "rgba(34, 211, 238, 0.35)"
                    : "rgba(51, 65, 85, 0.45)",
                }}
              />
            );
          })}
        </div>

        {/* Native Range Input styled with modern-web-guidance `slider` best practices */}
        <input
          ref={sliderRef}
          id="temporal-scrubber"
          type="range"
          min={0}
          max={TOTAL_TIME_STEPS - 1}
          step={1}
          value={timeIndex}
          aria-valuetext={`${formattedUtc}, Global Frequency ${currentGlobal.global_primary_frequency} Hz, Mean Power ${currentGlobal.global_amplitude} pT squared per Hz`}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
          className="resonance-range-slider relative z-10"
        />

        {/* Timeline Axis Tick Labels */}
        <div className="mt-0.5 flex justify-between px-1 font-mono text-[9px] text-slate-400 select-none md:text-[10px]">
          <span>{dataset.timestamps[0]?.slice(5, 16).replace("T", " ")} (T-71h)</span>
          <span className="hidden sm:inline">{dataset.timestamps[18]?.slice(5, 16).replace("T", " ")} UTC</span>
          <span>{dataset.timestamps[36]?.slice(5, 16).replace("T", " ")} (T-35h)</span>
          <span className="hidden sm:inline">{dataset.timestamps[54]?.slice(5, 16).replace("T", " ")} UTC</span>
          <span className="text-emerald-400 font-semibold">
            {dataset.timestamps[TOTAL_TIME_STEPS - 1]
              ?.slice(5, 16)
              .replace("T", " ")}{" "}
            (NOW)
          </span>
        </div>
      </div>
    </footer>
  );
}

