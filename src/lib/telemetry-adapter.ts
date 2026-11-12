// TelemetrySourceAdapter decouples live space-weather & ELF stream ingestion
// from the coupled spherical Earth-Ionosphere waveguide physics engine.

export type ProvenanceMode = "HYBRID_NOAA_LIVE" | "SYNTHETIC_SIMULATION";

export interface LiveSpaceWeatherSample {
  timestampUtc: string;
  kpIndex: number;
  solarWindSpeedKms: number;
  solarWindDensityCm3: number;
}

export interface TelemetryProvenance {
  mode: ProvenanceMode;
  lastSyncedUtc: string | null;
  kpSource: string;
  solarWindSource: string;
  elfSpectraSource: string;
  liveOverridesByHourEpoch: Record<
    number,
    { kpIndex?: number; solarWindKms?: number }
  >;
}

export interface TelemetrySourceAdapter {
  readonly id: string;
  readonly label: string;
  fetchLatestSpaceWeather(): Promise<TelemetryProvenance>;
}

// Official public CORS-enabled NOAA Space Weather Prediction Center (SWPC) JSON feeds
const NOAA_KP_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const NOAA_SOLAR_WIND_URL =
  "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json";

export class NoaaHybridTelemetryAdapter implements TelemetrySourceAdapter {
  readonly id = "noaa-swpc-hybrid";
  readonly label = "NOAA SWPC Live Kp/Solar-Wind + Coupled Waveguide Solver";

  async fetchLatestSpaceWeather(): Promise<TelemetryProvenance> {
    const liveOverridesByHourEpoch: Record<
      number,
      { kpIndex?: number; solarWindKms?: number }
    > = {};

    try {
      const [kpRes, swRes] = await Promise.allSettled([
        fetch(NOAA_KP_URL, { cache: "no-store" }),
        fetch(NOAA_SOLAR_WIND_URL, { cache: "no-store" }),
      ]);

      let fetchedAny = false;

      if (kpRes.status === "fulfilled" && kpRes.value.ok) {
        const kpRows: string[][] = await kpRes.value.json();
        // Format: [["time_tag","Kp","a_running","station_count"], ["2026-11-11 21:00:00.000", "2.33", ...]]
        for (let i = 1; i < kpRows.length; i++) {
          const row = kpRows[i];
          if (!row || row.length < 2) continue;
          const ts = Date.parse(row[0].replace(" ", "T") + "Z");
          const kp = parseFloat(row[1]);
          if (!Number.isNaN(ts) && !Number.isNaN(kp)) {
            const hourEpoch = Math.floor(ts / 3600000);
            // Apply 3-hour planetary Kp across its 3 constituent UTC hours
            for (let h = 0; h < 3; h++) {
              const targetHour = hourEpoch + h;
              liveOverridesByHourEpoch[targetHour] = {
                ...liveOverridesByHourEpoch[targetHour],
                kpIndex: Number(kp.toFixed(1)),
              };
            }
            fetchedAny = true;
          }
        }
      }

      if (swRes.status === "fulfilled" && swRes.value.ok) {
        const swRows: string[][] = await swRes.value.json();
        // Format: [["time_tag","density","speed","temperature"], ...]
        for (let i = 1; i < swRows.length; i += 15) {
          const row = swRows[i];
          if (!row || row.length < 3) continue;
          const ts = Date.parse(row[0].replace(" ", "T") + "Z");
          const speed = parseFloat(row[2]);
          if (!Number.isNaN(ts) && !Number.isNaN(speed) && speed > 150) {
            const hourEpoch = Math.floor(ts / 3600000);
            liveOverridesByHourEpoch[hourEpoch] = {
              ...liveOverridesByHourEpoch[hourEpoch],
              solarWindKms: Math.round(speed),
            };
            fetchedAny = true;
          }
        }
      }

      if (fetchedAny) {
        return {
          mode: "HYBRID_NOAA_LIVE",
          lastSyncedUtc: new Date().toISOString(),
          kpSource: "NOAA SWPC Planetary K-Index (GFZ/USAF Live Stream)",
          solarWindSource: "NOAA DSCOVR L1 Faraday Cup Plasma Feed",
          elfSpectraSource:
            "Coupled Spherical Waveguide Eigenmode Solver (f₁–f₅)",
          liveOverridesByHourEpoch,
        };
      }
    } catch {
      // Fallback cleanly to deterministic synthetic simulation if offline or blocked
    }

    return {
      mode: "SYNTHETIC_SIMULATION",
      lastSyncedUtc: null,
      kpSource: "Synthetic Diurnal + Solar-Storm Kp Model",
      solarWindSource: "Synthetic L1 Magnetopause Velocity Model",
      elfSpectraSource: "Deterministic 72h Spherical Cavity Simulation",
      liveOverridesByHourEpoch: {},
    };
  }
}

export const defaultTelemetryAdapter = new NoaaHybridTelemetryAdapter();
