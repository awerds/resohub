import { create } from "zustand";
import {
  DEFAULT_SSR_EPOCH_MS,
  PolarizationMode,
  TOTAL_TIME_STEPS,
  STATIONS,
} from "@/lib/schumann-data";
import {
  defaultTelemetryAdapter,
  TelemetryProvenance,
} from "@/lib/telemetry-adapter";

export type MetricMode =
  | "amplitude"
  | "frequency"
  | "quality_factor"
  | "q_burst";

export type HarmonicMode = 1 | 2 | 3 | 4 | 5;

export interface GlobeLayerState {
  showStationNodes: boolean;
  showIonosphericHeatmap: boolean;
  showQBurstRings: boolean;
  showCoherenceArcs: boolean;
  autoRotateGlobe: boolean;
  showAtmosphereGlow: boolean;
}

export interface CameraTarget {
  lat: number;
  lng: number;
  altitude: number;
  ts: number;
}

interface ResonanceStoreState {
  anchorHourEpochMs: number;
  provenance: TelemetryProvenance;
  timeIndex: number;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 4;
  selectedStationId: string | null;
  inspectingQBurst: boolean;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  activeMetric: MetricMode;
  selectedHarmonic: HarmonicMode;
  polarizationMode: PolarizationMode;
  layers: GlobeLayerState;
  cameraTarget: CameraTarget | null;

  // Actions
  syncLiveClock: () => void;
  refreshLiveSpaceWeather: () => Promise<void>;
  setTimeIndex: (index: number | ((prev: number) => number)) => void;
  stepTime: (delta: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: 1 | 2 | 4) => void;
  selectStation: (locationId: string | null, flyTo?: boolean) => void;
  selectQBurstEpicenter: (
    lat: number,
    lng: number,
    flyTo?: boolean
  ) => void;
  setInspectingQBurst: (inspecting: boolean) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveMetric: (metric: MetricMode) => void;
  setSelectedHarmonic: (mode: HarmonicMode) => void;
  setPolarizationMode: (mode: PolarizationMode) => void;
  toggleLayer: (layer: keyof GlobeLayerState) => void;
  resetGlobeView: () => void;
}

export const useResonanceStore = create<ResonanceStoreState>((set) => ({
  anchorHourEpochMs: DEFAULT_SSR_EPOCH_MS,
  provenance: {
    mode: "SYNTHETIC_SIMULATION",
    lastSyncedUtc: null,
    kpSource: "Synthetic Diurnal + Solar-Storm Kp Model",
    solarWindSource: "Synthetic L1 Magnetopause Velocity Model",
    elfSpectraSource: "Coupled Spherical Waveguide Eigenmode Solver (f₁–f₅)",
    liveOverridesByHourEpoch: {},
  },
  timeIndex: 55,
  isPlaying: true,
  playbackSpeed: 4,
  selectedStationId: "TOMSK-RU",
  inspectingQBurst: false,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  activeMetric: "amplitude",
  selectedHarmonic: 1,
  polarizationMode: "TOTAL",
  layers: {
    showStationNodes: true,
    showIonosphericHeatmap: true,
    showQBurstRings: true,
    showCoherenceArcs: true,
    autoRotateGlobe: false,
    showAtmosphereGlow: true,
  },
  cameraTarget: null,

  syncLiveClock: () => {
    const liveHourMs = Math.floor(Date.now() / 3600000) * 3600000;
    set((state) =>
      state.anchorHourEpochMs === liveHourMs
        ? state
        : { anchorHourEpochMs: liveHourMs }
    );
  },

  refreshLiveSpaceWeather: async () => {
    const prov = await defaultTelemetryAdapter.fetchLatestSpaceWeather();
    set({ provenance: prov });
  },

  setTimeIndex: (indexOrUpdater) =>
    set((state) => {
      const next =
        typeof indexOrUpdater === "function"
          ? indexOrUpdater(state.timeIndex)
          : indexOrUpdater;
      const clamped = Math.max(0, Math.min(TOTAL_TIME_STEPS - 1, next));
      return { timeIndex: clamped };
    }),

  stepTime: (delta) =>
    set((state) => {
      const next = (state.timeIndex + delta + TOTAL_TIME_STEPS) % TOTAL_TIME_STEPS;
      return { timeIndex: next };
    }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  selectStation: (locationId, flyTo = true) =>
    set((state) => {
      if (!locationId) {
        return { selectedStationId: null, inspectingQBurst: false };
      }
      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 1024;
      const station = STATIONS.find((s) => s.location_id === locationId);
      const nextCamera =
        flyTo && station
          ? {
              lat: station.latitude,
              lng: station.longitude,
              altitude: isMobile ? 2.15 : 1.75,
              ts: Date.now(),
            }
          : state.cameraTarget;

      return {
        selectedStationId: locationId,
        inspectingQBurst: false,
        isRightSidebarOpen: isMobile ? state.isRightSidebarOpen : true,
        isLeftSidebarOpen: isMobile ? false : state.isLeftSidebarOpen,
        cameraTarget: nextCamera,
      };
    }),

  selectQBurstEpicenter: (lat, lng, flyTo = true) =>
    set((state) => {
      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 1024;
      return {
        inspectingQBurst: true,
        isRightSidebarOpen: isMobile ? state.isRightSidebarOpen : true,
        isLeftSidebarOpen: isMobile ? false : state.isLeftSidebarOpen,
        cameraTarget: flyTo
          ? {
              lat,
              lng,
              altitude: isMobile ? 2.05 : 1.65,
              ts: Date.now(),
            }
          : state.cameraTarget,
      };
    }),

  setInspectingQBurst: (inspecting) => set({ inspectingQBurst: inspecting }),
  setLeftSidebarOpen: (open) =>
    set((state) => ({
      isLeftSidebarOpen: open,
      isRightSidebarOpen:
        open && typeof window !== "undefined" && window.innerWidth < 1024
          ? false
          : state.isRightSidebarOpen,
    })),
  setRightSidebarOpen: (open) =>
    set((state) => ({
      isRightSidebarOpen: open,
      isLeftSidebarOpen:
        open && typeof window !== "undefined" && window.innerWidth < 1024
          ? false
          : state.isLeftSidebarOpen,
    })),
  setActiveMetric: (metric) => set({ activeMetric: metric }),
  setSelectedHarmonic: (mode) => set({ selectedHarmonic: mode }),
  setPolarizationMode: (mode) => set({ polarizationMode: mode }),

  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
    })),

  resetGlobeView: () => {
    const isNarrowMobile =
      typeof window !== "undefined" && window.innerWidth < 640;
    set({
      inspectingQBurst: false,
      cameraTarget: {
        lat: 20,
        lng: 15,
        altitude: isNarrowMobile ? 2.65 : 2.25,
        ts: Date.now(),
      },
    });
  },
}));
