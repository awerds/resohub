"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  GlobalBaselinePoint,
  SchumannDataRecord,
} from "@/lib/schumann-data";

interface WidgetProps {
  stationHistory: SchumannDataRecord[];
  globalBaseline: GlobalBaselinePoint[];
  currentTimeIndex: number;
  onSelectTimeIndex?: (index: number) => void;
}

// 1. Live-Updating 2D Waterfall Time-Frequency Spectrogram (0 - 42 Hz over 24h window ending at currentTimeIndex)
export function SpectrogramWaterfallWidget({
  stationHistory,
  currentTimeIndex,
}: {
  stationHistory: SchumannDataRecord[];
  currentTimeIndex: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extract a 24-hour window ending at currentTimeIndex (or starting from 0)
  const windowRecords = useMemo(() => {
    const start = Math.max(0, currentTimeIndex - 23);
    const slice = stationHistory.slice(start, currentTimeIndex + 1);
    return slice;
  }, [stationHistory, currentTimeIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || windowRecords.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cols = windowRecords.length;
    const binsCount = windowRecords[0].spectrum_bins.length; // 41 bins (2 Hz .. 42 Hz)
    const colWidth = width / Math.max(1, cols);
    const rowHeight = height / binsCount;

    // Helper to convert power (1..95) to scientific spectrogram RGB (Deep Navy -> Cyan -> Emerald -> Yellow -> Crimson)
    const powerToColor = (power: number): string => {
      const norm = Math.min(1, Math.max(0, (power - 3) / 68));
      if (norm < 0.25) {
        const t = norm / 0.25;
        return `rgb(${Math.round(6 + t * 8)}, ${Math.round(
          18 + t * 85
        )}, ${Math.round(45 + t * 130)})`;
      }
      if (norm < 0.55) {
        const t = (norm - 0.25) / 0.3;
        return `rgb(${Math.round(14 + t * 12)}, ${Math.round(
          103 + t * 110
        )}, ${Math.round(175 - t * 45)})`;
      }
      if (norm < 0.8) {
        const t = (norm - 0.55) / 0.25;
        return `rgb(${Math.round(26 + t * 220)}, ${Math.round(
          213 - t * 35
        )}, ${Math.round(130 - t * 105)})`;
      }
      const t = (norm - 0.8) / 0.2;
      return `rgb(${Math.round(246 + t * 9)}, ${Math.round(
        178 - t * 125
      )}, ${Math.round(25 + t * 65)})`;
    };

    for (let c = 0; c < cols; c++) {
      const rec = windowRecords[c];
      const bins = rec.spectrum_bins;
      for (let b = 0; b < binsCount; b++) {
        // Draw low frequencies at the bottom, high frequencies at the top
        const invertedRow = binsCount - 1 - b;
        ctx.fillStyle = powerToColor(bins[b].power);
        ctx.fillRect(
          Math.floor(c * colWidth),
          Math.floor(invertedRow * rowHeight),
          Math.ceil(colWidth) + 1,
          Math.ceil(rowHeight) + 1
        );
      }
    }

    // Draw horizontal harmonic reference lines (7.83, 14.3, 20.8, 27.3, 33.8 Hz)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    const harmonics = [7.83, 14.3, 20.8, 27.3, 33.8];
    harmonics.forEach((hFreq) => {
      const normY = 1 - (hFreq - 2) / 40;
      const y = normY * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }, [windowRecords]);

  const currentRecord = windowRecords[windowRecords.length - 1];

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
            2D ELF Waterfall Spectrogram
          </h3>
          <p className="text-[11px] text-slate-400">
            2–42 Hz Dynamic Time-Frequency Matrix ({windowRecords.length}h Window)
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-slate-400">-dB</span>
          <div className="h-2 w-16 rounded-sm bg-gradient-to-r from-[#06122d] via-cyan-500 via-amber-400 to-rose-500" />
          <span className="text-rose-400">+dB</span>
        </div>
      </div>

      <div className="relative flex gap-2">
        {/* Frequency Y-Axis Labels */}
        <div className="flex flex-col justify-between py-0.5 font-mono text-[9px] text-slate-400 select-none">
          <span>33.8Hz</span>
          <span>27.3Hz</span>
          <span>20.8Hz</span>
          <span>14.3Hz</span>
          <span className="text-cyan-300 font-bold">7.83Hz</span>
          <span>2.0Hz</span>
        </div>

        {/* Canvas Waterfall */}
        <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-800">
          <canvas
            ref={canvasRef}
            width={360}
            height={132}
            className="block h-[132px] w-full"
          />
          <div className="pointer-events-none absolute top-1.5 right-2 rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 border border-cyan-500/30">
            NOW → {currentRecord?.primary_frequency.toFixed(2)} Hz
          </div>
        </div>
      </div>

      {/* Instantaneous Power Spectral Density Curve at Current Timestamp */}
      {currentRecord && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span>INSTANTANEOUS HARMONIC PSD PROFILE (f₁–f₅)</span>
            <span className="text-emerald-400">
              Peak: {currentRecord.amplitude.toFixed(1)} pT²/Hz
            </span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentRecord.spectrum_bins}
                margin={{ top: 4, right: 6, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="psdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 3"
                  stroke="rgba(51, 65, 85, 0.35)"
                />
                <XAxis
                  dataKey="freq"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  tickFormatter={(v) => `${v}Hz`}
                  interval={7}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(2, 6, 23, 0.95)",
                    borderColor: "rgba(34, 211, 238, 0.4)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: number) => [`${val} pT²/Hz`, "Spectral Power"]}
                  labelFormatter={(freq) => `Frequency: ${freq} Hz`}
                />
                <ReferenceLine
                  x={8}
                  stroke="#22d3ee"
                  strokeDasharray="2 2"
                />
                <ReferenceLine
                  x={14}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                />
                <ReferenceLine
                  x={21}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="#22d3ee"
                  strokeWidth={1.75}
                  fill="url(#psdGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Reusable Frequency Drift Widget (Local Frequency vs. Global Baseline & 7.83 Hz)
export function FrequencyComparisonWidget({
  stationHistory,
  globalBaseline,
  currentTimeIndex,
}: WidgetProps) {
  const chartData = useMemo(() => {
    const start = Math.max(0, currentTimeIndex - 23);
    const end = Math.min(stationHistory.length - 1, currentTimeIndex + 6);
    const rows = [];
    for (let i = start; i <= end; i++) {
      const st = stationHistory[i];
      const gl = globalBaseline[i];
      if (!st || !gl) continue;
      rows.push({
        timeIndex: i,
        timeLabel: st.timestamp.slice(11, 16),
        localFreq: st.primary_frequency,
        globalFreq: gl.global_primary_frequency,
        nominal: 7.83,
      });
    }
    return rows;
  }, [stationHistory, globalBaseline, currentTimeIndex]);

  const currentSt = stationHistory[currentTimeIndex];
  const currentGl = globalBaseline[currentTimeIndex];

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
            Frequency Drift vs. Global Baseline
          </h3>
          <p className="text-[11px] text-slate-400">
            Local f₁ Mode vs. Planetary Mean (7.83 Hz Reference)
          </p>
        </div>
        {currentSt && currentGl && (
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-cyan-300">
              {currentSt.primary_frequency.toFixed(3)} Hz
            </div>
            <div className="text-[10px] text-slate-400">
              ΔGlobal:{" "}
              {(
                currentSt.primary_frequency - currentGl.global_primary_frequency
              ).toFixed(3)}{" "}
              Hz
            </div>
          </div>
        )}
      </div>

      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="2 3"
              stroke="rgba(51, 65, 85, 0.35)"
            />
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: "#94a3b8", fontSize: 9 }}
              interval={4}
            />
            <YAxis
              domain={[7.68, 8.0]}
              tick={{ fill: "#94a3b8", fontSize: 9 }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(2, 6, 23, 0.95)",
                borderColor: "rgba(34, 211, 238, 0.4)",
                borderRadius: "8px",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            />
            <ReferenceLine
              y={7.83}
              stroke="rgba(148, 163, 184, 0.45)"
              strokeDasharray="3 3"
            />
            {currentSt && (
              <ReferenceLine
                x={currentSt.timestamp.slice(11, 16)}
                stroke="#f43f5e"
                strokeWidth={1.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="localFreq"
              name="Local Station (Hz)"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="globalFreq"
              name="Global Mean (Hz)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 3. Reusable Amplitude (Power) & Quality Factor Dual Telemetry Widget
export function AmplitudeAndQualityWidget({
  stationHistory,
  globalBaseline,
  currentTimeIndex,
}: WidgetProps) {
  const chartData = useMemo(() => {
    const start = Math.max(0, currentTimeIndex - 23);
    const end = Math.min(stationHistory.length - 1, currentTimeIndex + 6);
    const rows = [];
    for (let i = start; i <= end; i++) {
      const st = stationHistory[i];
      const gl = globalBaseline[i];
      if (!st || !gl) continue;
      rows.push({
        timeLabel: st.timestamp.slice(11, 16),
        amplitude: st.amplitude,
        globalAmplitude: gl.global_amplitude,
        qFactor: st.quality_factor,
        qBurst: st.q_burst_intensity,
      });
    }
    return rows;
  }, [stationHistory, globalBaseline, currentTimeIndex]);

  const currentSt = stationHistory[currentTimeIndex];

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
            Amplitude Power & Cavity Q-Factor
          </h3>
          <p className="text-[11px] text-slate-400">
            Power Density (pT²/Hz) & Waveguide Resonance Efficiency
          </p>
        </div>
        {currentSt && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-400 font-bold">
              {currentSt.amplitude.toFixed(1)} pT²
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300 font-bold">
              Q {currentSt.quality_factor.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: -18, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="2 3"
              stroke="rgba(51, 65, 85, 0.35)"
            />
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: "#94a3b8", fontSize: 9 }}
              interval={4}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#10b981", fontSize: 9 }}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#38bdf8", fontSize: 9 }}
              domain={[3, 12]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(2, 6, 23, 0.95)",
                borderColor: "rgba(16, 185, 129, 0.4)",
                borderRadius: "8px",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            />
            {currentSt && (
              <ReferenceLine
                yAxisId="left"
                x={currentSt.timestamp.slice(11, 16)}
                stroke="#f43f5e"
                strokeWidth={1.5}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey="amplitude"
              name="Power (pT²/Hz)"
              fill="rgba(16, 185, 129, 0.38)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="qFactor"
              name="Quality Factor (Q)"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

