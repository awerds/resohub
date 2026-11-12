export interface HarmonicSpectrumBin {
  freq: number; // 0 to 45 Hz
  power: number; // dB / pT^2/Hz
}

export interface AtmosphericMetadata {
  kp_index: number; // 0 - 9 planetary geomagnetic index
  solar_wind_kms: number; // km/s
  ionospheric_cavity_height_km: number; // ~55 - 88 km D/E region
  local_lightning_flashes_min: number;
  ambient_temp_c: number;
  humidity_pct: number;
  barometric_hpa: number;
  b_field_nt: number; // Local magnetic field nanoTesla
}

export interface SchumannDataRecord {
  timestamp: string; // ISO string
  timeIndex: number; // 0 .. TOTAL_STEPS - 1
  location_id: string;
  station_name: string;
  region: string;
  institution: string;
  sensor_type: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  // Core required fields
  primary_frequency: number; // Mode 1 (~7.83 Hz)
  amplitude: number; // Power pT^2/Hz (10 - 95)
  quality_factor: number; // Q-factor (~4.0 - 11.5)
  // Higher harmonics
  harmonic_2: number; // ~14.3 Hz
  harmonic_3: number; // ~20.8 Hz
  harmonic_4: number; // ~27.3 Hz
  harmonic_5: number; // ~33.8 Hz
  // Transient Q-bursts (intense global lightning discharges)
  q_burst_intensity: number; // 0 to 100
  is_q_burst: boolean;
  phase_coherence: number; // 0.50 - 0.99
  // Spectrum slice (0..45 Hz) for 2D spectrogram & PSD profile
  spectrum_bins: HarmonicSpectrumBin[];
  metadata: AtmosphericMetadata;
}

export interface StationDefinition {
  location_id: string;
  station_name: string;
  short_code: string;
  region: string;
  institution: string;
  sensor_type: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  base_freq_offset: number;
  base_amp: number;
  chimney_phase_rad: number;
}

export interface GlobalBaselinePoint {
  timestamp: string;
  timeIndex: number;
  global_primary_frequency: number;
  global_amplitude: number;
  global_quality_factor: number;
  active_q_bursts: number;
  kp_index: number;
}

export interface HeatmapCell {
  lat: number;
  lng: number;
  intensity: number; // 0 to 1 normalized cavity resonance intensity
  frequency: number; // local cavity drift around 7.83 Hz
  qFactor: number;
  color: string;
  altitude: number;
  radius: number;
}

export interface CoherenceArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  coherence: number;
  color: [string, string];
  label: string;
}

export const STATIONS: StationDefinition[] = [
  {
    location_id: "TOMSK-RU",
    station_name: "Tomsk Space-Physical Observatory",
    short_code: "TMSK",
    region: "Western Siberia, Russia",
    institution: "Tomsk State University ELF Lab",
    sensor_type: "Induction Coil Magnetometer (N-S / E-W)",
    latitude: 56.4884,
    longitude: 84.948,
    elevation_m: 170,
    base_freq_offset: 0.012,
    base_amp: 34.5,
    chimney_phase_rad: 0.4,
  },
  {
    location_id: "MT-HAMILTON-US",
    station_name: "Mt. Hamilton GCI Array",
    short_code: "MHCA",
    region: "California, USA",
    institution: "Global Coherence Monitoring Network",
    sensor_type: "Zonge ANT-4 Cryo-Induction Sensor",
    latitude: 37.3414,
    longitude: -121.6429,
    elevation_m: 1283,
    base_freq_offset: -0.018,
    base_amp: 29.8,
    chimney_phase_rad: 2.1,
  },
  {
    location_id: "SUTHERLAND-ZA",
    station_name: "Karoo Geomagnetic Sanctuary",
    short_code: "SUTH",
    region: "Northern Cape, South Africa",
    institution: "SAAO / SANSA ELF Array",
    sensor_type: "Tri-Axial Fluxgate & ELF Loop",
    latitude: -32.3794,
    longitude: 20.8106,
    elevation_m: 1758,
    base_freq_offset: 0.028,
    base_amp: 44.2, // Close to African Congo lightning chimney
    chimney_phase_rad: 1.15,
  },
  {
    location_id: "LAUDER-NZ",
    station_name: "Lauder Ionospheric Station",
    short_code: "LAUD",
    region: "Central Otago, New Zealand",
    institution: "NIWA Southern Hemisphere ELF Node",
    sensor_type: "Superconducting SQUID ELF Receiver",
    latitude: -45.038,
    longitude: 169.684,
    elevation_m: 370,
    base_freq_offset: -0.009,
    base_amp: 26.4,
    chimney_phase_rad: 3.4,
  },
  {
    location_id: "CUMIANA-IT",
    station_name: "Marconi VLF/ELF Observatory",
    short_code: "CUMI",
    region: "Piedmont (Turin), Italy",
    institution: "Open Lab VLF-ELF Monitoring Project",
    sensor_type: "Marconi Dual-Dipole & H-Field Loop",
    latitude: 44.98,
    longitude: 7.376,
    elevation_m: 380,
    base_freq_offset: 0.006,
    base_amp: 31.7,
    chimney_phase_rad: 1.4,
  },
  {
    location_id: "MOSHIRI-JP",
    station_name: "Moshiri ISEE ELF Observatory",
    short_code: "MSHR",
    region: "Hokkaido, Japan",
    institution: "Nagoya Univ. Space-Earth Env. Inst.",
    sensor_type: "High-Sensitivity Search-Coil ELF",
    latitude: 44.3667,
    longitude: 142.2667,
    elevation_m: 290,
    base_freq_offset: 0.015,
    base_amp: 36.1, // Close to SE Asian Maritime Continent chimney
    chimney_phase_rad: 0.1,
  },
  {
    location_id: "USHUAIA-AR",
    station_name: "Austral Sub-Antarctic ELF Array",
    short_code: "USHU",
    region: "Tierra del Fuego, Argentina",
    institution: "CADIC Ionospheric Research Center",
    sensor_type: "Telluric & Orthogonal Induction Array",
    latitude: -54.8019,
    longitude: -68.303,
    elevation_m: 145,
    base_freq_offset: -0.022,
    base_amp: 38.9, // Resonates with Amazonian lightning chimney
    chimney_phase_rad: 1.85,
  },
  {
    location_id: "SODANKYLA-FI",
    station_name: "Sodankylä Geophysical Observatory",
    short_code: "SGOF",
    region: "Lapland, Finland",
    institution: "University of Oulu Auroral ELF",
    sensor_type: "Auroral Cavity Search-Coil Array",
    latitude: 67.367,
    longitude: 26.633,
    elevation_m: 180,
    base_freq_offset: -0.031,
    base_amp: 33.0,
    chimney_phase_rad: 0.95,
  },
];

// Deterministic pseudo-random helper so SSR and client match
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const TOTAL_TIME_STEPS = 72; // 72 hours (3 days at 1-hour intervals)

export interface SimulatedDataset {
  anchorHourEpochMs: number;
  timestamps: string[];
  recordsByTime: SchumannDataRecord[][];
  recordsByStation: Record<string, SchumannDataRecord[]>;
  globalBaseline: GlobalBaselinePoint[];
}

function buildSpectrumBins(
  f1: number,
  f2: number,
  f3: number,
  f4: number,
  f5: number,
  amp1: number,
  q1: number,
  qBurst: number,
  seedBase: number
): HarmonicSpectrumBin[] {
  const bins: HarmonicSpectrumBin[] = [];
  const modes = [
    { freq: f1, amp: amp1, q: q1 },
    { freq: f2, amp: amp1 * 0.72, q: q1 * 1.12 },
    { freq: f3, amp: amp1 * 0.51, q: q1 * 1.24 },
    { freq: f4, amp: amp1 * 0.36, q: q1 * 1.32 },
    { freq: f5, amp: amp1 * 0.25, q: q1 * 1.4 },
  ];

  // Sample from 2 Hz to 42 Hz in 1.0 Hz steps (41 bins)
  for (let freq = 2; freq <= 42; freq += 1) {
    // Pink 1/f background noise + Q-burst broadband excitation
    let power = 6.5 / Math.pow(freq, 0.35) + qBurst * 0.18;

    for (const m of modes) {
      const gamma = m.freq / (2 * m.q);
      // Lorentzian resonance curve
      const lorentz =
        (gamma * gamma) / ((freq - m.freq) * (freq - m.freq) + gamma * gamma);
      power += m.amp * lorentz;
    }

    const jitter = (seededNoise(seedBase + freq * 17) - 0.5) * 2.4;
    bins.push({
      freq,
      power: Math.max(1.2, Number((power + jitter).toFixed(2))),
    });
  }
  return bins;
}

export const DEFAULT_SSR_EPOCH_MS = Date.UTC(2026, 10, 12, 0, 0, 0);

let cachedDataset: SimulatedDataset | null = null;

export function getSchumannDataset(
  anchorHourEpochMs: number = DEFAULT_SSR_EPOCH_MS
): SimulatedDataset {
  if (cachedDataset && cachedDataset.anchorHourEpochMs === anchorHourEpochMs) {
    return cachedDataset;
  }

  const timestamps: string[] = [];
  const recordsByTimeList: SchumannDataRecord[][] = [];
  const recordsByStation: Record<string, SchumannDataRecord[]> = {};
  const globalBaseline: GlobalBaselinePoint[] = [];

  for (const st of STATIONS) {
    recordsByStation[st.location_id] = [];
  }

  for (let t = 0; t < TOTAL_TIME_STEPS; t++) {
    const epochMs =
      anchorHourEpochMs - (TOTAL_TIME_STEPS - 1 - t) * 3600 * 1000;
    const epochHourIndex = Math.floor(epochMs / 3600000);
    const iso = new Date(epochMs).toISOString();
    timestamps.push(iso);

    const utcHour = new Date(epochMs).getUTCHours();
    // Global lightning chimneys peak at ~08:00 UTC (Asia), ~14:00 UTC (Africa), ~20:00 UTC (Americas)
    const asiaChimney = Math.exp(-Math.pow((utcHour - 8) / 3.5, 2));
    const africaChimney = Math.exp(-Math.pow((utcHour - 14) / 3.2, 2)) * 1.35;
    const americaChimney = Math.exp(-Math.pow((utcHour - 20) / 3.5, 2)) * 1.1;
    const diurnalExcitation = asiaChimney + africaChimney + americaChimney;

    // Simulate recurring solar geomagnetic storms / Q-burst surges + deterministic epoch-hour waves
    const windowSurge1 = Math.exp(-Math.pow((t - 24) / 3.0, 2));
    const windowSurge2 = Math.exp(-Math.pow((t - 55) / 2.6, 2));
    const cyclicSurge =
      Math.max(0, Math.sin(epochHourIndex * 0.21) * Math.cos(epochHourIndex * 0.07)) * 0.9;
    const solarSurge = Math.max(windowSurge1 * 0.85, windowSurge2 * 1.15, cyclicSurge);

    const kpIndex = Number(
      Math.min(
        8.7,
        1.8 +
          diurnalExcitation * 0.9 +
          solarSurge * 4.8 +
          seededNoise(epochHourIndex * 31) * 0.6
      ).toFixed(1)
    );

    const stepRecords: SchumannDataRecord[] = [];
    let sumFreq = 0;
    let sumAmp = 0;
    let sumQ = 0;
    let qBurstCount = 0;

    STATIONS.forEach((st, idx) => {
      const seed = epochHourIndex * 101 + idx * 37;
      const n1 = seededNoise(seed) - 0.5;
      const n2 = seededNoise(seed + 13) - 0.5;
      const n3 = seededNoise(seed + 29);

      const stationWave = Math.sin(
        (utcHour / 24) * Math.PI * 2 + st.chimney_phase_rad
      );

      // Primary frequency oscillates subtly around 7.83 Hz (7.64 to 8.08 Hz)
      const primary_frequency = Number(
        (
          7.83 +
          st.base_freq_offset +
          stationWave * 0.065 +
          solarSurge * 0.11 * (idx % 2 === 0 ? 1 : -0.6) +
          n1 * 0.045
        ).toFixed(3)
      );

      // Q-burst transient calculation
      const qBurstRaw =
        solarSurge * 58 +
        diurnalExcitation * 16 +
        (n3 > 0.82 ? (n3 - 0.5) * 75 : n3 * 18);
      const q_burst_intensity = Number(
        Math.min(99, Math.max(4, qBurstRaw)).toFixed(1)
      );
      const is_q_burst = q_burst_intensity >= 64;
      if (is_q_burst) qBurstCount++;

      // Amplitude (pT^2/Hz power)
      const amplitude = Number(
        Math.min(
          98,
          Math.max(
            12,
            st.base_amp +
              diurnalExcitation * 14.5 +
              stationWave * 8.2 +
              solarSurge * 29.0 +
              (is_q_burst ? 16.5 : 0) +
              n2 * 6.4
          )
        ).toFixed(1)
      );

      // Quality factor (Q-factor of Earth-Ionosphere waveguide)
      const quality_factor = Number(
        Math.min(
          11.8,
          Math.max(
            3.8,
            5.4 +
              (amplitude / 95) * 3.8 -
              solarSurge * 0.65 +
              Math.cos(t * 0.3 + idx) * 0.75 +
              n1 * 0.5
          )
        ).toFixed(2)
      );

      const harmonic_2 = Number(
        (14.3 + (primary_frequency - 7.83) * 1.65 + n2 * 0.05).toFixed(2)
      );
      const harmonic_3 = Number(
        (20.8 + (primary_frequency - 7.83) * 2.1 + n1 * 0.07).toFixed(2)
      );
      const harmonic_4 = Number(
        (27.3 + (primary_frequency - 7.83) * 2.55 + n2 * 0.09).toFixed(2)
      );
      const harmonic_5 = Number(
        (33.8 + (primary_frequency - 7.83) * 3.0 + n1 * 0.11).toFixed(2)
      );

      const phase_coherence = Number(
        Math.min(
          0.99,
          Math.max(0.52, 0.74 + solarSurge * 0.14 + stationWave * 0.06 + n1 * 0.05)
        ).toFixed(2)
      );

      const spectrum_bins = buildSpectrumBins(
        primary_frequency,
        harmonic_2,
        harmonic_3,
        harmonic_4,
        harmonic_5,
        amplitude,
        quality_factor,
        q_burst_intensity,
        seed
      );

      const record: SchumannDataRecord = {
        timestamp: iso,
        timeIndex: t,
        location_id: st.location_id,
        station_name: st.station_name,
        region: st.region,
        institution: st.institution,
        sensor_type: st.sensor_type,
        latitude: st.latitude,
        longitude: st.longitude,
        elevation_m: st.elevation_m,
        primary_frequency,
        amplitude,
        quality_factor,
        harmonic_2,
        harmonic_3,
        harmonic_4,
        harmonic_5,
        q_burst_intensity,
        is_q_burst,
        phase_coherence,
        spectrum_bins,
        metadata: {
          kp_index: kpIndex,
          solar_wind_kms: Math.round(385 + solarSurge * 290 + n3 * 35),
          ionospheric_cavity_height_km: Number(
            (72.5 - diurnalExcitation * 6.8 - solarSurge * 4.5 + n1 * 1.4).toFixed(1)
          ),
          local_lightning_flashes_min: Math.round(
            Math.max(2, (amplitude - 15) * 1.7 + (is_q_burst ? 45 : 0))
          ),
          ambient_temp_c: Number(
            (
              18 -
              Math.abs(st.latitude) * 0.42 +
              Math.sin(((utcHour + st.longitude / 15) / 24) * Math.PI * 2) * 5.5
            ).toFixed(1)
          ),
          humidity_pct: Math.round(48 + seededNoise(seed + 99) * 38),
          barometric_hpa: Number((1013.2 - st.elevation_m * 0.08 + n2 * 6).toFixed(1)),
          b_field_nt: Math.round(28000 + Math.abs(st.latitude) * 410 + solarSurge * 185),
        },
      };

      stepRecords.push(record);
      recordsByStation[st.location_id].push(record);

      sumFreq += primary_frequency;
      sumAmp += amplitude;
      sumQ += quality_factor;
    });

    recordsByTimeList.push(stepRecords);
    globalBaseline.push({
      timestamp: iso,
      timeIndex: t,
      global_primary_frequency: Number((sumFreq / STATIONS.length).toFixed(3)),
      global_amplitude: Number((sumAmp / STATIONS.length).toFixed(1)),
      global_quality_factor: Number((sumQ / STATIONS.length).toFixed(2)),
      active_q_bursts: qBurstCount,
      kp_index: kpIndex,
    });
  }

  cachedDataset = {
    anchorHourEpochMs,
    timestamps,
    recordsByTime: recordsByTimeList,
    recordsByStation,
    globalBaseline,
  };

  return cachedDataset;
}

// Compute ionospheric cavity resonance heatmap points across the globe at a specific timeIndex
export function computeIonosphericHeatmap(
  recordsAtTime: SchumannDataRecord[],
  timeIndex: number,
  metricMode: "amplitude" | "frequency" | "quality_factor" | "q_burst"
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const latStep = 15;
  const lngStep = 20;

  // Tropical lightning chimney centers that move with UTC time
  const chimneyLng = ((14 - (timeIndex % 24)) * 15 + 540) % 360 - 180;

  for (let lat = -60; lat <= 60; lat += latStep) {
    for (let lng = -160; lng <= 180; lng += lngStep) {
      // Inverse-distance weighted interpolation from our 8 real stations + equatorial waveguide standing wave
      let weightedVal = 0;
      let weightedFreq = 0;
      let weightedQ = 0;
      let weightSum = 0;

      for (const r of recordsAtTime) {
        const dLat = lat - r.latitude;
        const dLng = ((lng - r.longitude + 540) % 360) - 180;
        const distSq = dLat * dLat + dLng * dLng + 95;
        const w = 1 / distSq;

        const metricScalar =
          metricMode === "amplitude"
            ? (r.amplitude - 15) / 80
            : metricMode === "frequency"
            ? (r.primary_frequency - 7.65) / 0.4
            : metricMode === "quality_factor"
            ? (r.quality_factor - 3.5) / 8.0
            : r.q_burst_intensity / 100;

        weightedVal += metricScalar * w;
        weightedFreq += r.primary_frequency * w;
        weightedQ += r.quality_factor * w;
        weightSum += w;
      }

      // Standing wave waveguide envelope (stronger in tropical chimney belt & auroral oval)
      const dChimneyLng = ((lng - chimneyLng + 540) % 360) - 180;
      const tropicalChimneyBoost =
        Math.exp(-(lat * lat) / 900) *
        Math.exp(-(dChimneyLng * dChimneyLng) / 2600) *
        0.28;

      const rawIntensity = weightedVal / weightSum + tropicalChimneyBoost;
      const intensity = Math.min(1, Math.max(0.08, rawIntensity));

      // Color mapping based on scientific telemetry palette (Cyan -> Emerald -> Amber -> Crimson/Violet)
      let color = "rgba(6, 182, 212, 0.28)";
      if (intensity > 0.78) {
        color = "rgba(244, 63, 94, 0.52)"; // High Q-burst / peak resonance crimson
      } else if (intensity > 0.58) {
        color = "rgba(245, 158, 11, 0.44)"; // Elevated amber
      } else if (intensity > 0.38) {
        color = "rgba(16, 185, 129, 0.36)"; // Nominal emerald
      } else {
        color = "rgba(56, 189, 248, 0.25)"; // Quiet ionospheric cyan
      }

      cells.push({
        lat: lat + (lng % 40 === 0 ? 3 : -3),
        lng,
        intensity: Number(intensity.toFixed(2)),
        frequency: Number((weightedFreq / weightSum).toFixed(3)),
        qFactor: Number((weightedQ / weightSum).toFixed(2)),
        color,
        altitude: 0.015 + intensity * 0.035,
        radius: 3.2 + intensity * 3.8,
      });
    }
  }

  return cells;
}

// Compute phase-locked waveguide coherence arcs between stations
export function computeCoherenceArcs(
  recordsAtTime: SchumannDataRecord[],
  selectedLocationId: string | null
): CoherenceArc[] {
  const arcs: CoherenceArc[] = [];
  for (let i = 0; i < recordsAtTime.length; i++) {
    for (let j = i + 1; j < recordsAtTime.length; j++) {
      const a = recordsAtTime[i];
      const b = recordsAtTime[j];
      const avgCoh = (a.phase_coherence + b.phase_coherence) / 2;
      const involvesSelected =
        selectedLocationId === a.location_id ||
        selectedLocationId === b.location_id;

      if (involvesSelected || (avgCoh > 0.81 && (i + j) % 2 === 0)) {
        const highEnergy = a.is_q_burst || b.is_q_burst;
        arcs.push({
          startLat: a.latitude,
          startLng: a.longitude,
          endLat: b.latitude,
          endLng: b.longitude,
          coherence: Number(avgCoh.toFixed(2)),
          color: highEnergy
            ? ["rgba(244, 63, 94, 0.85)", "rgba(245, 158, 11, 0.85)"]
            : involvesSelected
            ? ["rgba(56, 189, 248, 0.9)", "rgba(16, 185, 129, 0.9)"]
            : ["rgba(56, 189, 248, 0.35)", "rgba(16, 185, 129, 0.35)"],
          label: `${a.location_id} ↔ ${b.location_id} (Φ ${Math.round(
            avgCoh * 100
          )}%)`,
        });
      }
    }
  }
  return arcs;
}

