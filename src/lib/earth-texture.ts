// Generates a high-contrast tactical satellite + graticule canvas data URL
// so the 3D globe renders immediately with zero external network failure risk,
// while also supporting night-lights / bathymetric aesthetics.

const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North America
  [
    [-168, 65], [-140, 70], [-125, 72], [-95, 75], [-75, 72], [-60, 52],
    [-65, 45], [-75, 35], [-81, 25], [-90, 20], [-84, 10], [-78, 8],
    [-85, 12], [-96, 18], [-105, 22], [-117, 32], [-124, 48], [-138, 58], [-165, 60]
  ],
  // Greenland
  [
    [-55, 60], [-42, 60], [-20, 70], [-18, 82], [-48, 83], [-62, 76], [-55, 60]
  ],
  // South America
  [
    [-78, 10], [-62, 10], [-50, 0], [-35, -6], [-38, -18], [-48, -28],
    [-58, -38], [-66, -54], [-74, -52], [-72, -35], [-70, -18], [-81, -5], [-78, 10]
  ],
  // Europe
  [
    [-10, 36], [5, 38], [15, 38], [28, 36], [30, 46], [42, 42], [58, 55],
    [60, 70], [30, 71], [10, 63], [5, 52], [-5, 48], [-10, 36]
  ],
  // Africa
  [
    [-17, 15], [-6, 35], [10, 37], [32, 31], [43, 12], [51, 11], [40, -10],
    [35, -24], [20, -35], [14, -22], [9, -2], [-8, 5], [-17, 15]
  ],
  // Asia
  [
    [30, 40], [42, 42], [58, 55], [60, 70], [95, 76], [135, 72], [178, 66],
    [160, 54], [142, 46], [130, 34], [122, 22], [108, 15], [103, 2],
    [96, 16], [88, 22], [78, 8], [68, 24], [55, 24], [48, 30], [36, 34], [30, 40]
  ],
  // Japan
  [
    [130, 31], [141, 35], [145, 44], [140, 41], [130, 31]
  ],
  // Maritime SE Asia / Indonesia
  [
    [95, 5], [106, -6], [118, -8], [125, -2], [115, 4], [95, 5]
  ],
  [
    [132, -2], [148, -6], [150, -9], [135, -7], [132, -2]
  ],
  // Australia
  [
    [114, -22], [128, -14], [142, -11], [153, -26], [148, -38],
    [136, -35], [122, -34], [114, -26], [114, -22]
  ],
  // New Zealand
  [
    [166, -46], [174, -41], [178, -37], [175, -35], [171, -43], [166, -46]
  ],
  // Antarctica
  [
    [-180, -72], [-120, -74], [-60, -66], [0, -70], [60, -68],
    [120, -67], [180, -72], [180, -89], [-180, -89]
  ]
];

let cachedTextureUrl: string | null = null;
let cachedBumpUrl: string | null = null;

export function getTacticalEarthTexture(): { mapUrl: string; bumpUrl: string } {
  if (typeof document === "undefined") {
    return { mapUrl: "", bumpUrl: "" };
  }
  if (cachedTextureUrl && cachedBumpUrl) {
    return { mapUrl: cachedTextureUrl, bumpUrl: cachedBumpUrl };
  }

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return { mapUrl: "", bumpUrl: "" };

  // 1. Deep abyssal ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#030816");
  oceanGrad.addColorStop(0.25, "#051026");
  oceanGrad.addColorStop(0.5, "#071836");
  oceanGrad.addColorStop(0.75, "#051026");
  oceanGrad.addColorStop(1, "#030816");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  const lngToX = (lng: number) => ((lng + 180) / 360) * width;
  const latToY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Subtle bathymetric / geomagnetic latitude bands
  ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
  ctx.lineWidth = 1;
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = latToY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lng = -165; lng <= 180; lng += 15) {
    const x = lngToX(lng);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Emphasize Equator & Auroral Ovals (65 deg N/S)
  ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
  ctx.lineWidth = 1.5;
  [0, 65, -65].forEach((lat) => {
    const y = latToY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  });

  // 3. Draw Continental Landmasses with glowing coastal borders
  ctx.save();
  for (const poly of CONTINENT_POLYGONS) {
    ctx.beginPath();
    poly.forEach(([lng, lat], idx) => {
      const x = lngToX(lng);
      const y = latToY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "#0c2342";
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();

  // 4. Add telemetry grid dots across continents & oceans
  ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
  for (let x = 0; x < width; x += 16) {
    for (let y = 0; y < height; y += 16) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  cachedTextureUrl = canvas.toDataURL("image/png");
  cachedBumpUrl = cachedTextureUrl;
  return { mapUrl: cachedTextureUrl, bumpUrl: cachedBumpUrl };
}

