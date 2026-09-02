import { BIOME_TILES } from "~/lib/wfc/tilesets/biome";
import type { GeometryData } from "./types";

type RGB = [number, number, number];
type Stop = [number, RGB];

function hexToRgb(hex: string): RGB {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

export const COLOR_MAP_IDS = [
  "none",
  "terrain",
  "biome",
  "grayscale",
  "viridis",
  "heat",
  "ice",
] as const;

export type ColorMapId = (typeof COLOR_MAP_IDS)[number];

export const COLOR_MAP_LABELS: Record<ColorMapId, string> = {
  none: "None",
  terrain: "Terrain",
  biome: "Biome",
  grayscale: "Grayscale",
  viridis: "Viridis",
  heat: "Heat",
  ice: "Ice",
};

const RAMPS: Record<Exclude<ColorMapId, "none">, Stop[]> = {
  terrain: [
    [0.0, hexToRgb("#124f7c")],
    [0.07, hexToRgb("#2e7fb0")],
    [0.11, hexToRgb("#d8c37a")],
    [0.18, hexToRgb("#63933f")],
    [0.4, hexToRgb("#356426")],
    [0.6, hexToRgb("#585f31")],
    [0.75, hexToRgb("#6d4f2f")],
    [0.88, hexToRgb("#8a7358")],
    [0.96, hexToRgb("#cfc7ba")],
    [1.0, hexToRgb("#ffffff")],
  ],
  biome: BIOME_TILES.map(
    (t, i) => [i / (BIOME_TILES.length - 1), hexToRgb(t.color)] as Stop,
  ),
  grayscale: [
    [0.0, [0.08, 0.08, 0.09]],
    [1.0, [0.96, 0.96, 0.97]],
  ],
  viridis: [
    [0.0, hexToRgb("#440154")],
    [0.25, hexToRgb("#3b528b")],
    [0.5, hexToRgb("#21918c")],
    [0.75, hexToRgb("#5ec962")],
    [1.0, hexToRgb("#fde725")],
  ],
  heat: [
    [0.0, hexToRgb("#000428")],
    [0.35, hexToRgb("#7a0f4e")],
    [0.62, hexToRgb("#f05a0f")],
    [0.85, hexToRgb("#ffd24a")],
    [1.0, hexToRgb("#fffbe6")],
  ],
  ice: [
    [0.0, hexToRgb("#04122b")],
    [0.5, hexToRgb("#2f6fb0")],
    [1.0, hexToRgb("#e8f6ff")],
  ],
};

export function colorMapIdFromIndex(index: number): ColorMapId {
  const i = Math.min(COLOR_MAP_IDS.length - 1, Math.max(0, Math.round(index)));
  return COLOR_MAP_IDS[i];
}

export function sampleColorMap(id: ColorMapId, t: number): RGB {
  if (id === "none") return [1, 1, 1];
  const stops = RAMPS[id];
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (x <= t1) {
      const f = t1 === t0 ? 0 : (x - t0) / (t1 - t0);
      return [
        c0[0] + (c1[0] - c0[0]) * f,
        c0[1] + (c1[1] - c0[1]) * f,
        c0[2] + (c1[2] - c0[2]) * f,
      ];
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * Map a set of scalar values (heights / field samples) onto colour-ramp
 * positions. Eroded / masked data has a strongly skewed distribution (a big
 * plateau or a big flat sea), so a plain min/max normalisation collapses most
 * of it onto one end of the ramp. We blend a robust linear mapping (2nd..98th
 * percentile) with a rank / histogram-equalised mapping so colour spreads
 * across the surface. `waterLevel` (0..1) floors the lowest fraction to a flat
 * sea colour. Returns rgb triples in 0..1.
 */
export function equalizedColors(
  values: Float32Array | number[],
  opts: { colorMap: ColorMapId; waterLevel?: number },
): Float32Array {
  const n = values.length;
  const out = new Float32Array(n * 3);
  if (n === 0 || opts.colorMap === "none") {
    out.fill(1);
    return out;
  }
  const water = Math.max(0, Math.min(0.95, opts.waterLevel ?? 0));

  const sorted = Float64Array.from(values as ArrayLike<number>).sort();
  const pct = (f: number) =>
    sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(f * (sorted.length - 1))))];
  const lo = pct(0.02);
  const linRange = pct(0.98) - lo || 1;
  const denom = sorted.length > 1 ? sorted.length - 1 : 1;
  const rankT = (v: number) => {
    let a = 0;
    let b = sorted.length;
    while (a < b) {
      const m = (a + b) >> 1;
      if (sorted[m] < v) a = m + 1;
      else b = m;
    }
    return a / denom;
  };

  const EQ = 0.65;
  for (let k = 0; k < n; k++) {
    const v = values[k];
    const lin = Math.min(1, Math.max(0, (v - lo) / linRange));
    let t = (1 - EQ) * lin + EQ * rankT(v);
    if (water > 0) t = t <= water ? 0 : (t - water) / (1 - water);
    const [r, g, b] = sampleColorMap(opts.colorMap, t);
    out[k * 3] = r;
    out[k * 3 + 1] = g;
    out[k * 3 + 2] = b;
  }
  return out;
}

/** Bake per-vertex colours from vertex height. */
export function applyHeightColors(
  geo: GeometryData,
  opts: { colorMap: ColorMapId; waterLevel?: number },
): GeometryData {
  if (opts.colorMap === "none") return geo;
  const n = geo.positions.length / 3;
  const ys = new Float32Array(n);
  for (let k = 0; k < n; k++) ys[k] = geo.positions[k * 3 + 1];
  return { ...geo, colors: equalizedColors(ys, opts) };
}
