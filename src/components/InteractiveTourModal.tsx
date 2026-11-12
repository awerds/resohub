"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Database,
  Globe2,
  Layers,
  Play,
  Radio,
  Sparkles,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { useResonanceStore } from "@/store/useResonanceStore";

const STORAGE_KEY = "reso_welcome_dismissed_v1";

export interface TourStep {
  stepNumber: number;
  badge: string;
  regionHighlight: "center" | "left" | "right" | "bottom" | "top";
  title: string;
  subtitle: string;
  explanation: string;
  physicsNote: string;
  actionLabel: string;
  onEnter: () => void;
}

export default function InteractiveTourModal({
  externalTriggerCount,
}: {
  externalTriggerCount: number;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const setTimeIndex = useResonanceStore((s) => s.setTimeIndex);
  const setActiveMetric = useResonanceStore((s) => s.setActiveMetric);
  const setSelectedHarmonic = useResonanceStore((s) => s.setSelectedHarmonic);
  const setPolarizationMode = useResonanceStore((s) => s.setPolarizationMode);
  const selectStation = useResonanceStore((s) => s.selectStation);
  const selectQBurstEpicenter = useResonanceStore(
    (s) => s.selectQBurstEpicenter
  );
  const setLeftSidebarOpen = useResonanceStore((s) => s.setLeftSidebarOpen);
  const setRightSidebarOpen = useResonanceStore((s) => s.setRightSidebarOpen);
  const resetGlobeView = useResonanceStore((s) => s.resetGlobeView);

  const tourSteps: TourStep[] = [
    {
      stepNumber: 1,
      badge: "1 / 6 · PLANETARY WAVEGUIDE",
      regionHighlight: "center",
      title: "The 3D Earth–Ionosphere Cavity",
      subtitle: "Global Electromagnetic Standing Waves (7.83 Hz Fundamental)",
      explanation:
        "The central 3D viewport visualizes Earth surrounded by a semi-transparent mesh representing the lower Ionospheric D/E-region boundary (~55–85 km altitude). Global lightning activity (~50–100 flashes/sec) excites standing electromagnetic waves trapped in this spherical shell.",
      physicsNote:
        "Formula: fₙ ≈ (c / 2πR_E)√(n(n+1)) damped by finite D-region conductivity, yielding eigenmodes at 7.83, 14.3, 20.8, 27.3, and 33.8 Hz.",
      actionLabel: "Reset Global Orbital View",
      onEnter: () => {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
        setTimeIndex(55);
        setActiveMetric("amplitude");
        resetGlobeView();
      },
    },
    {
      stepNumber: 2,
      badge: "2 / 6 · LEFT CONTROL MATRIX",
      regionHighlight: "left",
      title: "Primary Visualization Modes & Harmonics",
      subtitle: "Switch Field Overlays, Eigenmodes (f₁–f₅), and Planetary Layers",
      explanation:
        "Use the Left Control Drawer to switch the 3D cavity overlay between Amplitude Power Spectral Density (pT²/Hz), Base Frequency Drift (Hz), Waveguide Quality Factor (Q), and Q-Burst Transients. You can also isolate individual harmonic eigenmodes (f₁–f₅) and toggle 3D layers.",
      physicsNote:
        "Each section in the left and right drawers is an independent accordion—collapse any section or hide either drawer to maximize WebGL canvas space.",
      actionLabel: "Preview Frequency Drift Overlay",
      onEnter: () => {
        setLeftSidebarOpen(true);
        setActiveMetric("frequency");
        setSelectedHarmonic(1);
      },
    },
    {
      stepNumber: 3,
      badge: "3 / 6 · COUPLED GEOMAGNETIC PHYSICS",
      regionHighlight: "center",
      title: "Coupled D-Region Altitude vs. Kp Index",
      subtitle: "Compare Baseline Quiet (Kp 1.2) vs. Super-Bolt Storm (Kp 8.7)",
      explanation:
        "Watch the Global Q / D-Alt readout in the top HUD and the D-Region Boundary card in the right inspector: during Baseline Quiet (Kp = 1.2), the undisturbed cavity ceiling sits at ~80.1 km. Switching to Super-Bolt Storm (Kp = 8.7) drives solar particle precipitation that compresses the D-region boundary down to ~60.1 km.",
      physicsNote:
        "High-latitude auroral observatories like SODANKYLA-FI (67.37°N) experience 1.42× stronger D-region compression, lowering Q and slightly depressing f₁.",
      actionLabel: "Compare Quiet (t=12) vs. Storm (t=55) at Sodankylä",
      onEnter: () => {
        setActiveMetric("amplitude");
        setTimeIndex(55);
        selectStation("SODANKYLA-FI", true);
      },
    },
    {
      stepNumber: 4,
      badge: "4 / 6 · LIGHTNING GEOLOCATION",
      regionHighlight: "right",
      title: "Interactive Q-Burst Shockwave Triangulation (Δt)",
      subtitle: "Sub-Millisecond Time-of-Arrival Across 8 Global Observatories",
      explanation:
        "Intense 'Super-Bolt' lightning discharges (Charge Moment > 1,000 C·km) ring the entire Earth-Ionosphere cavity like a bell. Clicking any pulsing crimson Q-Burst Epicenter on the 3D globe draws 3D propagation vectors to all 8 stations and opens the Time-of-Arrival (Δt) table in the Right Inspector.",
      physicsNote:
        "ELF TM₀ waves propagate at v_phase ≈ 0.78c (~233,838 km/s), reaching all 8 observatories within 8 to 85 milliseconds followed by an antipodal echo.",
      actionLabel: "Triangulate Active Super-Bolt Epicenter",
      onEnter: () => {
        setTimeIndex(55);
        setRightSidebarOpen(true);
        selectQBurstEpicenter(-2.4, 23.8, true);
      },
    },
    {
      stepNumber: 5,
      badge: "5 / 6 · SPECTRAL & VECTOR ANALYSIS",
      regionHighlight: "right",
      title: "2D Waterfall Spectrogram & Vector Polarization",
      subtitle: "Orthogonal Induction Coils (H_NS vs. H_EW) & Radial Electric (E_r)",
      explanation:
        "In the Right Inspector, inspect the 24-hour 2D Time-Frequency Waterfall (2–42 Hz) and the Instantaneous Harmonic PSD curve. Use the polarization buttons (B_tot | H_NS | H_EW | DUAL | E_r) to compare North–South vs. East–West horizontal magnetic induction channels simultaneously.",
      physicsNote:
        "Because TM₀ propagation is transverse-magnetic, the H_NS / H_EW power ratio reveals the azimuthal bearing of the active thunderstorm chimney.",
      actionLabel: "Activate Dual H_NS + H_EW Trace Overlay",
      onEnter: () => {
        setRightSidebarOpen(true);
        selectStation("TOMSK-RU", true);
        setPolarizationMode("DUAL_H");
      },
    },
    {
      stepNumber: 6,
      badge: "6 / 6 · TEMPORAL & DATA PROVENANCE",
      regionHighlight: "bottom",
      title: "72-Hour Time Travel & NOAA SWPC Provenance",
      subtitle: "Scrub Historical Frames, Run Time-Lapse, & Inspect Live Feeds",
      explanation:
        "Use the bottom 72-hour timeline slider to scrub through diurnal chimney cycles, play/pause time-lapse animations at 1x/2x/4x speed, or jump to scenario presets. Click the top-right PROVENANCE badge anytime to inspect the TelemetrySourceAdapter and sync live NOAA SWPC planetary Kp & solar wind feeds.",
      physicsNote:
        "The 72-hour window automatically advances with the live UTC hour so shared links always reflect the latest 72-hour telemetry window.",
      actionLabel: "Restore Default View & Finish",
      onEnter: () => {
        setPolarizationMode("TOTAL");
        setTimeIndex(55);
        resetGlobeView();
      },
    },
  ];

  // Open welcome modal on initial client mount (unless user opted out)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Fallback for browsers without native closedBy support per modern-web-guidance `dialog` & `light-dismiss-a-dialog`
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const isOutside = (e: PointerEvent, dlg: HTMLDialogElement) => {
        const r = dlg.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e, dialog);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e, dialog)) {
          dialog.close();
        }
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
    }

    const onClose = () => {
      dialog.returnValue = "";
    };
    dialog.addEventListener("close", onClose);

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
      if (!dismissed && !dialog.open) {
        dialog.showModal();
      }
    } catch {
      if (!dialog.open) dialog.showModal();
    }

    return () => {
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  // Re-open welcome modal whenever externalTriggerCount increments (from header button)
  useEffect(() => {
    if (externalTriggerCount > 0) {
      setTourActive(false);
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    }
  }, [externalTriggerCount]);

  const handlePersistPreference = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(STORAGE_KEY, "1");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleStartGuidedTour = () => {
    handlePersistPreference();
    dialogRef.current?.close();
    setCurrentStepIdx(0);
    setTourActive(true);
    tourSteps[0].onEnter();
  };

  const handleEnterDirectly = () => {
    handlePersistPreference();
    dialogRef.current?.close();
    setTourActive(false);
  };

  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(tourSteps.length - 1, idx));
    setCurrentStepIdx(clamped);
    tourSteps[clamped].onEnter();
  };

  const activeStep = tourSteps[currentStepIdx];

  return (
    <>
      {/* Native <dialog> Modal opened with showModal() and closedby="any" per modern-web-guidance `dialog` */}
      <dialog
        ref={dialogRef}
        id="welcome-mission-dialog"
        aria-labelledby="welcome-mission-title"
        {...({ closedby: "any" } as Record<string, string>)}
        className="m-auto w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#050b16]/95 p-0 text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.22)] backdrop-blur-2xl open:flex open:flex-col"
      >
        {/* Top Banner */}
        <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-cyan-400">
                  RESO // EARTH-ELF TELEMETRY
                </span>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                  7.83 Hz CAVITY
                </span>
              </div>
              <h2
                id="welcome-mission-title"
                className="mt-0.5 font-mono text-lg font-bold text-white"
              >
                Global Schumann Resonance Command Center
              </h2>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              value="cancel"
              aria-label="Close welcome dialog"
              onClick={handlePersistPreference}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-300">
            Welcome to <strong className="text-white">RESO // EARTH-ELF</strong>
            —an interactive 3D planetary visualization and spectral analysis
            platform for tracking electromagnetic standing waves in the
            Earth–Ionosphere waveguide cavity across 8 global magnetometer
            observatories.
          </p>

          {/* 4 Subsystem Preview Cards */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-300">
                <Waves className="h-4 w-4" />
                <span>3D Waveguide & Eigenmodes</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Inspect fundamental (7.83 Hz) through 5th harmonic (33.8 Hz)
                standing waves and Kp-coupled D-region altitude compression.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-300">
                <Crosshair className="h-4 w-4" />
                <span>Q-Burst Δt Geolocation</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Click any super-bolt shockwave ring on the 3D globe to
                triangulate sub-millisecond arrival times (v_p ≈ 0.78c).
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-300">
                <Activity className="h-4 w-4" />
                <span>2D Waterfall & Polarization</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Analyze 2–42 Hz dynamic spectrograms and toggle orthogonal
                induction coil traces (H_NS vs. H_EW and vertical E_r).
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-300">
                <Database className="h-4 w-4" />
                <span>72h Scrubber & NOAA Live Feed</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Scrub 72 hours of diurnal chimney cycles, trigger storm
                benchmarks, and ingest live NOAA SWPC Kp & solar wind data.
              </p>
            </div>
          </div>

          {/* Choice Callout */}
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-4 py-3 text-xs text-cyan-100/90">
            Would you like to take a{" "}
            <strong className="text-cyan-300">
              6-step interactive guided tour
            </strong>{" "}
            that demonstrates each live instrument and physical model, or jump
            straight into the dashboard?
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/90 bg-slate-950/80 px-6 py-4">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 accent-cyan-400 cursor-pointer"
            />
            <span>Don&apos;t show automatically on startup</span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleEnterDirectly}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Use Site Directly
            </button>

            <button
              type="button"
              autoFocus
              onClick={handleStartGuidedTour}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-500/25 px-4 py-2 font-mono text-xs font-bold text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:bg-cyan-500/35"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>Start Interactive Tour (6 Steps)</span>
            </button>
          </div>
        </div>
      </dialog>

      {/* Non-Blocking Interactive Guided Tour HUD Card when Tour is Active */}
      {tourActive && activeStep && (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between p-4">
          {/* Directional Region Highlight Ring Indicator */}
          <div className="flex justify-center pt-12">
            <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-cyan-400/60 bg-[#040914]/95 p-4 text-slate-100 shadow-[0_0_45px_rgba(34,211,238,0.28)] backdrop-blur-xl">
              {/* Top Step Progress Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-cyan-300 border border-cyan-400/40">
                    {activeStep.badge}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-emerald-400">
                    ● Focus: {activeStep.regionHighlight.toUpperCase()} PANEL
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {tourSteps.map((s, idx) => (
                    <button
                      key={s.stepNumber}
                      type="button"
                      onClick={() => goToStep(idx)}
                      title={`Jump to Step ${s.stepNumber}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStepIdx
                          ? "w-6 bg-cyan-400"
                          : idx < currentStepIdx
                          ? "w-2 bg-emerald-400/70"
                          : "w-2 bg-slate-700"
                      }`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setTourActive(false)}
                    title="Exit Guided Tour"
                    className="ml-2 flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Step Content */}
              <div className="mt-3">
                <h3 className="font-mono text-sm font-bold text-white">
                  {activeStep.title}
                </h3>
                <p className="font-mono text-[11px] text-cyan-300/90">
                  {activeStep.subtitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {activeStep.explanation}
                </p>
                <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/75 px-3 py-2 font-mono text-[11px] text-emerald-300/95">
                  <span className="font-bold text-cyan-300">
                    Geophysics Note:{" "}
                  </span>
                  {activeStep.physicsNote}
                </div>
              </div>

              {/* Step Navigation Footer */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/90 pt-3">
                <button
                  type="button"
                  onClick={() => activeStep.onEnter()}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Demo: {activeStep.actionLabel}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentStepIdx === 0}
                    onClick={() => goToStep(currentStepIdx - 1)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  {currentStepIdx < tourSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => goToStep(currentStepIdx + 1)}
                      className="flex items-center gap-1 rounded-lg border border-cyan-400/60 bg-cyan-500/25 px-3 py-1 font-mono text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/35"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        activeStep.onEnter();
                        setTourActive(false);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/25 px-3 py-1 font-mono text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/35"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Finish Tour</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
