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
import { Crosshair, Flame, Radio, Zap } from "lucide-react";
import {
  GlobalBaselinePoint,
  PolarizationMode,
  QBurstGeolocationEvent,
  SchumannDataRecord,
} from "@/lib/schumann-data";

interface WidgetProps {
  stationHistory: SchumannDataRecord[];
  globalBaseline: GlobalBaselinePoint[];
  currentTimeIndex: number;
  polarizationMode?: PolarizationMode;
  onSelectPolarization?: (mode: PolarizationMode) => void;
}

// 1. Live-Updating 2D Waterfall Time-Frequency Spectrogram + Vector Polarization PSD
export function SpectrogramWaterfallWidget({
  stationHistory,
  currentTimeIndex,
  polarizationMode = "TOTAL",
  onSelectPolarization,
}: {
  stationHistory: SchumannDataRecord[];
  currentTimeIndex: number;
  polarizationMode?: PolarizationMode;
  onSelectPolarization?: (mode: PolarizationMode) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const windowRecords = useMemo(() => {
    const start = Math.max(0, currentTimeIndex - 23);
    return stationHistory.slice(start, currentTimeIndex + 1);
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

    const powerToColor = (power: number): string => {
      const maxScale = polarizationMode === "E_R" ? 32 : 68;
      const norm = Math.min(1, Math.max(0, (power - 1.5) / maxScale));
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
        const invertedRow = binsCount - 1 - b;
        const bin = bins[b];
        const val =
          polarizationMode === "H_NS"
            ? bin.power_h_ns
            : polarizationMode === "H_EW"
            ? bin.power_h_ew
            : polarizationMode === "E_R"
            ? bin.power_e_r
            : bin.power;

        ctx.fillStyle = powerToColor(val);
        ctx.fillRect(
          Math.floor(c * colWidth),
          Math.floor(invertedRow * rowHeight),
          Math.ceil(colWidth) + 1,
          Math.ceil(rowHeight) + 1
        );
      }
    }

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
  }, [windowRecords, polarizationMode]);

  const currentRecord = windowRecords[windowRecords.length - 1];
  const unitLabel =
    polarizationMode === "E_R" ? "mV²/m²/Hz" : "pT²/Hz";

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-200">
            2D ELF Waterfall Spectrogram
          </h3>
          <p className="text-[10px] text-slate-400">
            2–42 Hz Time-Frequency Matrix ({windowRecords.length}h) ·{" "}
            <span className="text-cyan-300 font-mono">{unitLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-slate-400">-dB</span>
          <div className="h-2 w-14 rounded-sm bg-gradient-to-r from-[#06122d] via-cyan-500 via-amber-400 to-rose-500" />
          <span className="text-rose-400">+dB</span>
        </div>
      </div>

      <div className="relative flex gap-2">
        <div className="flex flex-col justify-between py-0.5 font-mono text-[9px] text-slate-400 select-none">
          <span>33.8Hz</span>
          <span>27.3Hz</span>
          <span>20.8Hz</span>
          <span>14.3Hz</span>
          <span className="text-cyan-300 font-bold">7.83Hz</span>
          <span>2.0Hz</span>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-800">
          <canvas
            ref={canvasRef}
            width={360}
            height={124}
            className="block h-[124px] w-full"
          />
          <div className="pointer-events-none absolute top-1.5 right-2 rounded bg-slate-950/85 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 border border-cyan-500/30">
            f₁ {currentRecord?.primary_frequency.toFixed(2)} Hz
          </div>
        </div>
      </div>

      {/* Polarization Component Selector + Instantaneous PSD Curve */}
      {currentRecord && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1 font-mono text-[10px]">
            <span className="text-slate-400">
              PSD PROFILE ({polarizationMode})
            </span>
            {onSelectPolarization && (
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "TOTAL", label: "B_tot" },
                    { id: "H_NS", label: "H_NS" },
                    { id: "H_EW", label: "H_EW" },
                    { id: "DUAL_H", label: "DUAL" },
                    { id: "E_R", label: "E_r" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectPolarization(m.id)}
                    className={`rounded px-1.5 py-0.5 text-[9px] transition ${
                      polarizationMode === m.id
                        ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 font-bold"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
            <span className="text-cyan-300">
              B_NS: {currentRecord.amplitude_h_ns.toFixed(1)} pT²/Hz
            </span>
            <span className="text-amber-300">
              B_EW: {currentRecord.amplitude_h_ew.toFixed(1)} pT²/Hz
            </span>
            <span className="text-emerald-300">
              Total: {currentRecord.amplitude.toFixed(1)} pT²/Hz
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
                  <linearGradient id="ewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
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
                    fontSize: "10px",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: number, name: string) => [
                    `${val} ${unitLabel}`,
                    name,
                  ]}
                  labelFormatter={(freq) => `Frequency: ${freq} Hz`}
                />
                <ReferenceLine x={8} stroke="#22d3ee" strokeDasharray="2 2" />
                <ReferenceLine x={14} stroke="#10b981" strokeDasharray="2 2" />
                <ReferenceLine x={21} stroke="#f59e0b" strokeDasharray="2 2" />

                {polarizationMode === "DUAL_H" ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="power_h_ns"
                      name="H_NS (North-South)"
                      stroke="#22d3ee"
                      strokeWidth={1.75}
                      fill="url(#psdGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="power_h_ew"
                      name="H_EW (East-West)"
                      stroke="#f59e0b"
                      strokeWidth={1.75}
                      fill="url(#ewGrad)"
                      isAnimationActive={false}
                    />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    dataKey={
                      polarizationMode === "H_NS"
                        ? "power_h_ns"
                        : polarizationMode === "H_EW"
                        ? "power_h_ew"
                        : polarizationMode === "E_R"
                        ? "power_e_r"
                        : "power"
                    }
                    name={`Spectral Power (${polarizationMode})`}
                    stroke={
                      polarizationMode === "H_EW"
                        ? "#f59e0b"
                        : polarizationMode === "E_R"
                        ? "#a855f7"
                        : "#22d3ee"
                    }
                    strokeWidth={1.75}
                    fill="url(#psdGrad)"
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Interactive Q-Burst Shockwave Source Geolocation & Arrival Time Delta (Δt) Matrix
export function QBurstTriangulationWidget({
  qBurstEvent,
  selectedStationId,
  onSelectStation,
  onFocusEpicenter,
}: {
  qBurstEvent: QBurstGeolocationEvent | null;
  selectedStationId: string | null;
  onSelectStation: (locationId: string) => void;
  onFocusEpicenter: (lat: number, lng: number) => void;
}) {
  if (!qBurstEvent) {
    return (
      <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 font-mono text-xs text-slate-400">
        No Q-Burst super-bolt discharge exceeding 62 pT threshold at this UTC
        hour. Select the <span className="text-rose-300">Super-Bolt Storm β</span>{" "}
        or <span className="text-amber-300">Solar Q-Surge α</span> preset to
        triangulate active transients.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/40 bg-slate-950/85 p-3 shadow-[0_0_24px_rgba(244,63,94,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-rose-200">
              Q-Burst Lightning Geolocation ({qBurstEvent.event_id})
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-300">
            {qBurstEvent.region_name}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onFocusEpicenter(
              qBurstEvent.epicenter_lat,
              qBurstEvent.epicenter_lng
            )
          }
          className="flex items-center gap-1 rounded-lg border border-rose-400/50 bg-rose-500/20 px-2 py-1 font-mono text-[10px] font-bold text-rose-200 transition hover:bg-rose-500/30"
        >
          <Crosshair className="h-3 w-3" />
          <span>EPICENTER</span>
        </button>
      </div>

      {/* Super-bolt physical parameters */}
      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2 font-mono text-[10px]">
        <div>
          <span className="text-slate-400 block">SOURCE COORDS</span>
          <span className="font-bold text-white">
            {qBurstEvent.epicenter_lat.toFixed(1)}°,{" "}
            {qBurstEvent.epicenter_lng.toFixed(1)}°
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">CHARGE MOMENT</span>
          <span className="font-bold text-amber-300">
            {qBurstEvent.charge_moment_c_km} C·km
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">PEAK CURRENT</span>
          <span className="font-bold text-rose-300">
            +{qBurstEvent.peak_current_ka} kA
          </span>
        </div>
      </div>

      {/* 8-Station Time-of-Arrival (Δt) Triangulation Table */}
      <div className="mt-2.5">
        <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-slate-400">
          <span>Station Arrival Order (v_p ≈ 0.78c)</span>
          <span>Dist · Δt Direct · Antipode</span>
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto pr-0.5 font-mono text-[10px]">
          {qBurstEvent.arrivals.map((arr, idx) => {
            const isSelected = arr.location_id === selectedStationId;
            return (
              <button
                key={arr.location_id}
                type="button"
                onClick={() => onSelectStation(arr.location_id)}
                className={`flex w-full items-center justify-between rounded-md border px-2 py-1 text-left transition ${
                  isSelected
                    ? "border-cyan-400/60 bg-cyan-950/40 text-cyan-200"
                    : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500">#{idx + 1}</span>
                  <span className="font-bold">{arr.location_id}</span>
                  <span className="text-[9px] text-slate-400">
                    ({arr.azimuth_deg}°)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {arr.distance_km.toLocaleString()}km
                  </span>
                  <span className="font-bold text-emerald-300">
                    +{arr.arrival_delta_ms.toFixed(1)}ms
                  </span>
                  <span className="text-[9px] text-rose-300/80">
                    ⟳{arr.antipodal_echo_ms.toFixed(0)}ms
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 3. Reusable Frequency Drift Widget (Local Frequency vs. Global Baseline & 7.83 Hz)
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
          <p className="text-[10px] text-slate-400">
            Coupled D-Region & Local f₁ Mode vs. Planetary Mean (7.83 Hz)
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

      <div className="h-32 w-full">
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

// 4. Reusable Amplitude (Power Spectral Density) & Quality Factor Dual Telemetry Widget
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
        amplitudeNs: st.amplitude_h_ns,
        amplitudeEw: st.amplitude_h_ew,
        qFactor: st.quality_factor,
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
            Amplitude PSD & Cavity Q-Factor
          </h3>
          <p className="text-[10px] text-slate-400">
            Spectral Density (pT²/Hz) & Waveguide Resonance Efficiency
          </p>
        </div>
        {currentSt && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-400 font-bold">
              {currentSt.amplitude.toFixed(1)} pT²/Hz
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300 font-bold">
              Q {currentSt.quality_factor.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="h-32 w-full">
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
              name="Total PSD (pT²/Hz)"
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
