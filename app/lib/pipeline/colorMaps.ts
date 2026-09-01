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
    [0.0, hexToRgb("#1d4e89")],
    [0.1, hexToRgb("#4a90c2")],
    [0.16, hexToRgb("#e3d59e")],
    [0.32, hexToRgb("#6aa84f")],
    [0.55, hexToRgb("#3d7a3a")],
    [0.72, hexToRgb("#7a6a52")],
    [0.88, hexToRgb("#8f8f8f")],
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
 * Bake per-vertex colours from the normalised height of each vertex. `waterLevel`
 * (0..1 of the height range) floors everything below it to a flat sea colour.
 */
export function applyHeightColors(
  geo: GeometryData,
  opts: { colorMap: ColorMapId; waterLevel?: number },
): GeometryData {
  if (opts.colorMap === "none") return geo;
  const pos = geo.positions;
  const water = Math.max(0, Math.min(0.95, opts.waterLevel ?? 0));

  let min = Infinity;
  let max = -Infinity;
  for (let i = 1; i < pos.length; i += 3) {
    if (pos[i] < min) min = pos[i];
    if (pos[i] > max) max = pos[i];
  }
  const range = max - min || 1;

  const colors = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    let t = (pos[i + 1] - min) / range;
    if (water > 0) t = t <= water ? 0 : (t - water) / (1 - water);
    const [r, g, b] = sampleColorMap(opts.colorMap, t);
    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }
  return { ...geo, colors };
}
