export type PolarizationMode = "TOTAL" | "H_NS" | "H_EW" | "DUAL_H" | "E_R";

export interface HarmonicSpectrumBin {
  freq: number; // 2 to 42 Hz
  power: number; // Total Horizontal Magnetic PSD (pT^2/Hz)
  power_h_ns: number; // North-South Induction Coil B_NS PSD (pT^2/Hz)
  power_h_ew: number; // East-West Induction Coil B_EW PSD (pT^2/Hz)
  power_e_r: number; // Radial Vertical Electric Field E_r PSD (mV^2/m^2/Hz)
}

export interface AtmosphericMetadata {
  kp_index: number; // 0 - 9 planetary geomagnetic index
  solar_wind_kms: number; // km/s
  ionospheric_cavity_height_km: number; // ~54.5 - 84.0 km D/E region
  d_region_compression_km: number; // Downward compression delta from quiet baseline
  local_lightning_flashes_min: number;
  ambient_temp_c: number;
  humidity_pct: number;
  barometric_hpa: number;
  b_field_nt: number; // Local magnetic field nanoTesla
}

export interface QBurstArrivalReadout {
  location_id: string;
  station_name: string;
  distance_km: number;
  arrival_delta_ms: number; // d / (0.78 * c) in milliseconds
  antipodal_echo_ms: number; // (40075 - d) / (0.78 * c)
  peak_pt: number;
  azimuth_deg: number;
}

export interface QBurstGeolocationEvent {
  event_id: string;
  timestamp: string;
  timeIndex: number;
  epicenter_lat: number;
  epicenter_lng: number;
  region_name: string;
  charge_moment_c_km: number; // Coulombs-km (typically 500 - 3500 C*km for Q-burst super-bolts)
  peak_current_ka: number; // kiloAmperes
  arrivals: QBurstArrivalReadout[];
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
  amplitude: number; // Total PSD Power pT^2/Hz
  amplitude_h_ns: number; // B_NS component PSD pT^2/Hz
  amplitude_h_ew: number; // B_EW component PSD pT^2/Hz
  amplitude_e_r: number; // E_r vertical electric component mV^2/m^2/Hz
  quality_factor: number; // Q-factor (~3.8 - 10.5)
  // Higher harmonics
  harmonic_2: number; // ~14.3 Hz
  harmonic_3: number; // ~20.8 Hz
  harmonic_4: number; // ~27.3 Hz
  harmonic_5: number; // ~33.8 Hz
  // Transient Q-bursts (intense global lightning discharges)
  q_burst_intensity: number; // 0 to 100 pT
  is_q_burst: boolean;
  q_burst_arrival_ms: number; // Arrival time delta from active Q-burst source (ms)
  q_burst_distance_km: number;
  phase_coherence: number; // 0.50 - 0.99
  // Spectrum slice (2..42 Hz) for 2D spectrogram & PSD profile
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
  ns_ew_anisotropy: number; // Polarization ratio bias based on chimney geometry
}

export interface GlobalBaselinePoint {
  timestamp: string;
  timeIndex: number;
  global_primary_frequency: number;
  global_amplitude: number;
  global_quality_factor: number;
  mean_d_region_km: number;
  active_q_bursts: number;
  kp_index: number;
  solar_wind_kms: number;
  q_burst_event: QBurstGeolocationEvent | null;
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
    ns_ew_anisotropy: 0.58,
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
    ns_ew_anisotropy: 0.46,
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
    base_amp: 44.2,
    chimney_phase_rad: 1.15,
    ns_ew_anisotropy: 0.39, // Strong meridional propagation from Congo chimney
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
    ns_ew_anisotropy: 0.52,
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
    ns_ew_anisotropy: 0.44,
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
    base_amp: 36.1,
    chimney_phase_rad: 0.1,
    ns_ew_anisotropy: 0.41,
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
    base_amp: 38.9,
    chimney_phase_rad: 1.85,
    ns_ew_anisotropy: 0.37,
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
    ns_ew_anisotropy: 0.63,
  },
];

// Deterministic pseudo-random helper
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Haversine great-circle distance on spherical Earth (R = 6371 km)
export function greatCircleDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Initial bearing / azimuth from epicenter to station
function computeAzimuthDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);
}

export const TOTAL_TIME_STEPS = 72; // 72 hours (3 days at 1-hour intervals)

export interface SimulatedDataset {
  anchorHourEpochMs: number;
  overridesSignature: string;
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
  nsRatio: number,
  seedBase: number
): HarmonicSpectrumBin[] {
  const bins: HarmonicSpectrumBin[] = [];
  const modes = [
    { freq: f1, amp: amp1, q: q1, nsWeight: nsRatio },
    {
      freq: f2,
      amp: amp1 * 0.72,
      q: q1 * 1.12,
      nsWeight: Math.min(0.85, nsRatio + 0.08),
    },
    {
      freq: f3,
      amp: amp1 * 0.51,
      q: q1 * 1.24,
      nsWeight: Math.max(0.2, nsRatio - 0.06),
    },
    { freq: f4, amp: amp1 * 0.36, q: q1 * 1.32, nsWeight: nsRatio },
    {
      freq: f5,
      amp: amp1 * 0.25,
      q: q1 * 1.4,
      nsWeight: 1 - nsRatio * 0.7,
    },
  ];

  // Sample from 2 Hz to 42 Hz in 1.0 Hz steps (41 bins)
  for (let freq = 2; freq <= 42; freq += 1) {
    const bg = 6.5 / Math.pow(freq, 0.35) + qBurst * 0.18;
    let totalPower = bg;
    let nsPower = bg * nsRatio;
    let ewPower = bg * (1 - nsRatio);

    for (const m of modes) {
      const gamma = m.freq / (2 * m.q);
      const lorentz =
        (gamma * gamma) / ((freq - m.freq) * (freq - m.freq) + gamma * gamma);
      const modeContrib = m.amp * lorentz;
      totalPower += modeContrib;
      nsPower += modeContrib * m.nsWeight;
      ewPower += modeContrib * (1 - m.nsWeight);
    }

    const jitter = (seededNoise(seedBase + freq * 17) - 0.5) * 2.2;
    const finalTotal = Math.max(1.2, Number((totalPower + jitter).toFixed(2)));
    const finalNs = Math.max(
      0.6,
      Number((nsPower + jitter * nsRatio).toFixed(2))
    );
    const finalEw = Math.max(
      0.6,
      Number((ewPower + jitter * (1 - nsRatio)).toFixed(2))
    );
    // Vertical radial electric field E_r scales with wave impedance in Earth-Ionosphere cavity
    const finalEr = Math.max(
      0.4,
      Number((finalTotal * 0.42 + Math.sin(freq * 0.3) * 0.8).toFixed(2))
    );

    bins.push({
      freq,
      power: finalTotal,
      power_h_ns: finalNs,
      power_h_ew: finalEw,
      power_e_r: finalEr,
    });
  }
  return bins;
}

const SUPERBOLT_CHIMNEY_REGIONS = [
  { name: "Congo Basin Equatorial Chimney", lat: -2.4, lng: 23.8 },
  { name: "Maritime Continent (Borneo/Celebes)", lat: 0.8, lng: 116.4 },
  { name: "Amazonas / Lake Maracaibo Basin", lat: -4.2, lng: -65.5 },
  { name: "South China Sea Mesoscale Convective Complex", lat: 14.5, lng: 113.2 },
  { name: "South Atlantic / Paraná Super-Cell", lat: -26.8, lng: -56.2 },
];

export const DEFAULT_SSR_EPOCH_MS = Date.UTC(2026, 10, 12, 0, 0, 0);

let cachedDataset: SimulatedDataset | null = null;

export function getSchumannDataset(
  anchorHourEpochMs: number = DEFAULT_SSR_EPOCH_MS,
  liveOverrides: Record<number, { kpIndex?: number; solarWindKms?: number }> = {}
): SimulatedDataset {
  const overridesSignature = Object.keys(liveOverrides).length.toString();
  if (
    cachedDataset &&
    cachedDataset.anchorHourEpochMs === anchorHourEpochMs &&
    cachedDataset.overridesSignature === overridesSignature
  ) {
    return cachedDataset;
  }

  const timestamps: string[] = [];
  const recordsByTimeList: SchumannDataRecord[][] = [];
  const recordsByStation: Record<string, SchumannDataRecord[]> = {};
  const globalBaseline: GlobalBaselinePoint[] = [];

  for (const st of STATIONS) {
    recordsByStation[st.location_id] = [];
  }

  // Speed of ELF TM0 wave in Earth-Ionosphere waveguide (~0.78c in km/ms)
  const ELF_PHASE_VELOCITY_KM_PER_MS = 233.838;

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

    // Scenario presets at t=12 (Quiet), t=24 (Solar Q-Surge alpha), t=38 (Equatorial Peak), t=55 (Super-Bolt Storm beta)
    const windowSurge1 = Math.exp(-Math.pow((t - 24) / 3.0, 2));
    const windowSurge2 = Math.exp(-Math.pow((t - 55) / 2.6, 2));
    const quietWindow = Math.exp(-Math.pow((t - 12) / 3.0, 2));
    const cyclicSurge =
      Math.max(
        0,
        Math.sin(epochHourIndex * 0.21) * Math.cos(epochHourIndex * 0.07)
      ) * 0.65;

    let solarSurge = Math.max(
      windowSurge1 * 0.88,
      windowSurge2 * 1.25,
      cyclicSurge * (1 - quietWindow * 0.8)
    );

    const liveOverride = liveOverrides[epochHourIndex];
    const kpIndex =
      liveOverride?.kpIndex !== undefined
        ? liveOverride.kpIndex
        : Number(
            Math.min(
              8.7,
              Math.max(
                1.1,
                1.4 -
                  quietWindow * 0.4 +
                  diurnalExcitation * 0.85 +
                  solarSurge * 5.4 +
                  seededNoise(epochHourIndex * 31) * 0.45
              )
            ).toFixed(1)
          );

    // If live Kp override came in from NOAA SWPC, couple solarSurge to Kp
    if (liveOverride?.kpIndex !== undefined && t > TOTAL_TIME_STEPS - 8) {
      solarSurge = Math.max(solarSurge, Math.max(0, (kpIndex - 2.0) / 6.0));
    }

    const solarWindKms =
      liveOverride?.solarWindKms !== undefined
        ? liveOverride.solarWindKms
        : Math.round(
            375 + solarSurge * 310 + seededNoise(epochHourIndex * 19) * 35
          );

    // Determine Q-Burst Super-Bolt Epicenter for this hour
    const chimneyIdx =
      Math.floor(seededNoise(epochHourIndex * 73) * SUPERBOLT_CHIMNEY_REGIONS.length) %
      SUPERBOLT_CHIMNEY_REGIONS.length;
    const baseChimney = SUPERBOLT_CHIMNEY_REGIONS[chimneyIdx];
    const epicenterLat = Number(
      (
        baseChimney.lat +
        (seededNoise(epochHourIndex * 41) - 0.5) * 8.0
      ).toFixed(2)
    );
    const epicenterLng = Number(
      (
        baseChimney.lng +
        (seededNoise(epochHourIndex * 59) - 0.5) * 12.0
      ).toFixed(2)
    );

    const stepRecords: SchumannDataRecord[] = [];
    const arrivals: QBurstArrivalReadout[] = [];
    let sumFreq = 0;
    let sumAmp = 0;
    let sumQ = 0;
    let sumDRegion = 0;
    let qBurstCount = 0;

    STATIONS.forEach((st, idx) => {
      const seed = epochHourIndex * 101 + idx * 37;
      const n1 = seededNoise(seed) - 0.5;
      const n2 = seededNoise(seed + 13) - 0.5;
      const n3 = seededNoise(seed + 29);

      const stationWave = Math.sin(
        (utcHour / 24) * Math.PI * 2 + st.chimney_phase_rad
      );

      // Great-circle distance & propagation arrival time from Q-burst super-bolt epicenter
      const distKm = Math.round(
        greatCircleDistanceKm(
          epicenterLat,
          epicenterLng,
          st.latitude,
          st.longitude
        )
      );
      const arrivalDeltaMs = Number(
        (distKm / ELF_PHASE_VELOCITY_KM_PER_MS).toFixed(2)
      );
      const antipodalEchoMs = Number(
        ((40075 - distKm) / ELF_PHASE_VELOCITY_KM_PER_MS).toFixed(2)
      );

      // Coupled Ionospheric D-Region Altitude Physics:
      // Quiet reference altitude ~78-83 km at night, ~70-74 km by day.
      // High Kp and solar X-ray / particle precipitation compress the lower D-region boundary
      // downward toward 55-60 km, especially at high auroral latitudes (|lat| > 50 deg).
      const absLat = Math.abs(st.latitude);
      const auroralCouplingFactor = absLat >= 52 ? 1.42 : absLat >= 40 ? 1.12 : 0.88;
      const localSolarHour = (utcHour + st.longitude / 15 + 24) % 24;
      const daytimeIonization = Math.max(
        0,
        Math.sin(((localSolarHour - 6) / 12) * Math.PI)
      );
      const quietDRegionKm = 81.5 - daytimeIonization * 6.2;
      const stormCompressionKm = Number(
        (
          ((kpIndex - 1.2) * 1.95 + solarSurge * 4.8) *
          auroralCouplingFactor
        ).toFixed(1)
      );
      const ionospheric_cavity_height_km = Number(
        Math.max(
          54.5,
          Math.min(84.0, quietDRegionKm - stormCompressionKm + n1 * 0.9)
        ).toFixed(1)
      );

      // Coupled Primary Frequency (f1 ~ 7.83 Hz):
      // Downward D-region compression & enhanced conductivity dispersion slightly depress f1
      // during severe geomagnetic particle precipitation, while diurnal chimney shifts modulate around 7.83 Hz.
      const dRegionFreqDepression = -Math.max(0, stormCompressionKm - 4.0) * 0.0055;
      const primary_frequency = Number(
        (
          7.83 +
          st.base_freq_offset +
          stationWave * 0.055 +
          dRegionFreqDepression +
          n1 * 0.035
        ).toFixed(3)
      );

      // Q-burst transient calculation
      const qBurstRaw =
        solarSurge * 62 +
        diurnalExcitation * 16 +
        (n3 > 0.8 ? (n3 - 0.45) * 75 : n3 * 18);
      const q_burst_intensity = Number(
        Math.min(99, Math.max(4, qBurstRaw)).toFixed(1)
      );
      const is_q_burst = q_burst_intensity >= 62;
      if (is_q_burst) qBurstCount++;

      // Total Horizontal Magnetic PSD Amplitude (pT^2/Hz)
      const amplitude = Number(
        Math.min(
          98,
          Math.max(
            12,
            st.base_amp +
              diurnalExcitation * 14.5 +
              stationWave * 8.2 +
              solarSurge * 29.5 +
              (is_q_burst ? 15.5 : 0) +
              n2 * 5.8
          )
        ).toFixed(1)
      );

      // Dynamic N-S / E-W polarization split
      const nsRatio = Math.min(
        0.78,
        Math.max(
          0.24,
          st.ns_ew_anisotropy + Math.sin((utcHour / 24) * Math.PI * 2) * 0.11
        )
      );
      const amplitude_h_ns = Number((amplitude * nsRatio).toFixed(1));
      const amplitude_h_ew = Number((amplitude * (1 - nsRatio)).toFixed(1));
      const amplitude_e_r = Number((amplitude * 0.42).toFixed(1));

      // Coupled Waveguide Quality Factor (Q):
      // Downward D-region compression into denser neutral atmosphere increases electron-neutral
      // collision damping, broadening spectral peaks and lowering Q during severe Kp storms.
      const stormQBroadening = Math.max(0, stormCompressionKm * 0.14);
      const quality_factor = Number(
        Math.min(
          10.6,
          Math.max(
            3.8,
            6.8 +
              diurnalExcitation * 0.95 -
              stormQBroadening +
              Math.cos(t * 0.25 + idx) * 0.45 +
              n1 * 0.35
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
          Math.max(
            0.52,
            0.74 + solarSurge * 0.14 + stationWave * 0.06 + n1 * 0.05
          )
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
        nsRatio,
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
        amplitude_h_ns,
        amplitude_h_ew,
        amplitude_e_r,
        quality_factor,
        harmonic_2,
        harmonic_3,
        harmonic_4,
        harmonic_5,
        q_burst_intensity,
        is_q_burst,
        q_burst_arrival_ms: arrivalDeltaMs,
        q_burst_distance_km: distKm,
        phase_coherence,
        spectrum_bins,
        metadata: {
          kp_index: kpIndex,
          solar_wind_kms: solarWindKms,
          ionospheric_cavity_height_km,
          d_region_compression_km: Number(stormCompressionKm.toFixed(1)),
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
          barometric_hpa: Number(
            (1013.2 - st.elevation_m * 0.08 + n2 * 6).toFixed(1)
          ),
          b_field_nt: Math.round(
            28000 + Math.abs(st.latitude) * 410 + solarSurge * 185
          ),
        },
      };

      stepRecords.push(record);
      recordsByStation[st.location_id].push(record);

      arrivals.push({
        location_id: st.location_id,
        station_name: st.station_name,
        distance_km: distKm,
        arrival_delta_ms: arrivalDeltaMs,
        antipodal_echo_ms: antipodalEchoMs,
        peak_pt: q_burst_intensity,
        azimuth_deg: computeAzimuthDeg(
          st.latitude,
          st.longitude,
          epicenterLat,
          epicenterLng
        ),
      });

      sumFreq += primary_frequency;
      sumAmp += amplitude;
      sumQ += quality_factor;
      sumDRegion += ionospheric_cavity_height_km;
    });

    // Sort arrivals by propagation arrival time delta (earliest arrival first)
    arrivals.sort((a, b) => a.arrival_delta_ms - b.arrival_delta_ms);

    const qBurstEvent: QBurstGeolocationEvent | null =
      qBurstCount > 0
        ? {
            event_id: `QB-${epochHourIndex.toString(16).toUpperCase()}`,
            timestamp: iso,
            timeIndex: t,
            epicenter_lat: epicenterLat,
            epicenter_lng: epicenterLng,
            region_name: baseChimney.name,
            charge_moment_c_km: Math.round(950 + solarSurge * 1850 + qBurstCount * 140),
            peak_current_ka: Math.round(145 + solarSurge * 190),
            arrivals,
          }
        : null;

    recordsByTimeList.push(stepRecords);
    globalBaseline.push({
      timestamp: iso,
      timeIndex: t,
      global_primary_frequency: Number((sumFreq / STATIONS.length).toFixed(3)),
      global_amplitude: Number((sumAmp / STATIONS.length).toFixed(1)),
      global_quality_factor: Number((sumQ / STATIONS.length).toFixed(2)),
      mean_d_region_km: Number((sumDRegion / STATIONS.length).toFixed(1)),
      active_q_bursts: qBurstCount,
      kp_index: kpIndex,
      solar_wind_kms: solarWindKms,
      q_burst_event: qBurstEvent,
    });
  }

  cachedDataset = {
    anchorHourEpochMs,
    overridesSignature,
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

  const chimneyLng = ((14 - (timeIndex % 24)) * 15 + 540) % 360 - 180;

  for (let lat = -60; lat <= 60; lat += latStep) {
    for (let lng = -160; lng <= 180; lng += lngStep) {
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

      const dChimneyLng = ((lng - chimneyLng + 540) % 360) - 180;
      const tropicalChimneyBoost =
        Math.exp(-(lat * lat) / 900) *
        Math.exp(-(dChimneyLng * dChimneyLng) / 2600) *
        0.28;

      const rawIntensity = weightedVal / weightSum + tropicalChimneyBoost;
      const intensity = Math.min(1, Math.max(0.08, rawIntensity));

      let color = "rgba(6, 182, 212, 0.28)";
      if (intensity > 0.78) {
        color = "rgba(244, 63, 94, 0.52)";
      } else if (intensity > 0.58) {
        color = "rgba(245, 158, 11, 0.44)";
      } else if (intensity > 0.38) {
        color = "rgba(16, 185, 129, 0.36)";
      } else {
        color = "rgba(56, 189, 248, 0.25)";
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

// Compute phase-locked waveguide coherence arcs between stations (plus Q-burst propagation arcs when selected)
export function computeCoherenceArcs(
  recordsAtTime: SchumannDataRecord[],
  selectedLocationId: string | null,
  activeQBurstEvent?: QBurstGeolocationEvent | null,
  inspectingQBurst?: boolean
): CoherenceArc[] {
  const arcs: CoherenceArc[] = [];

  if (inspectingQBurst && activeQBurstEvent) {
    for (const r of recordsAtTime) {
      arcs.push({
        startLat: activeQBurstEvent.epicenter_lat,
        startLng: activeQBurstEvent.epicenter_lng,
        endLat: r.latitude,
        endLng: r.longitude,
        coherence: 0.98,
        color: ["rgba(244, 63, 94, 0.95)", "rgba(34, 211, 238, 0.85)"],
        label: `Q-Burst Propagation → ${r.location_id} (Δt ${r.q_burst_arrival_ms} ms)`,
      });
    }
    return arcs;
  }

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
