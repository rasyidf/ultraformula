import { BIOME_TILES } from "~/lib/wfc/tilesets/biome";
import { DEFAULT_WORLD_SIZE } from "../ops/erosion";

const WORLD_MIN = -DEFAULT_WORLD_SIZE / 2;
import type { Field, NodeDefinition, PortValue } from "../types";
import { num, select, toggle } from "./_shared";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * Convert a tile grid into a scalar field so WFC output can drive terrain the
 * same way Perlin does. "Elevation ramp" maps the palette index (ordered
 * low -> high) to a height; "Tile mask" outputs 1 on the chosen tile, -1 elsewhere.
 */
export const tileToFieldNode: NodeDefinition = {
  type: "tileToField",
  label: "Tiles → Field",
  category: "Modifier",
  group: "Combine",
  description: "Turn a tile grid into a height field (elevation ramp or a tile mask)",
  tags: ["wfc", "tiles", "biome", "convert", "field"],
  inputs: [{ id: "in", label: "Tiles", type: "tilegrid" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    mode: select("mode", [0, 1], ["Elevation ramp", "Tile mask"], 0),
    maskTile: select(
      "mask tile",
      BIOME_TILES.map((_, i) => i),
      BIOME_TILES.map((t) => t.name),
      0,
    ),
    heightScale: num("height scale", { min: 0.1, max: 12, step: 0.1, default: 1 }),
    smooth: toggle("smooth", 1),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const tg = inputs.in;
    if (!tg || tg.type !== "tilegrid") {
      throw new Error("Tiles → Field needs a tile grid input");
    }
    const grid = tg.value;
    const mode = Math.round(params.mode ?? 0);
    const maskTile = Math.round(params.maskTile ?? 0);
    const hs = params.heightScale ?? 1;
    const smooth = !!Math.round(params.smooth ?? 1);
    const paletteMax = Math.max(1, grid.palette.length - 1);

    const cellValue = (cx: number, cy: number) => {
      const x = clamp(cx, 0, grid.width - 1);
      const y = clamp(cy, 0, grid.height - 1);
      const raw = grid.cells[y * grid.width + x];
      const idx = raw < 0 ? 0 : raw;
      if (mode === 1) return idx === maskTile ? 1 : -1;
      return (idx / paletteMax) * 2 - 1;
    };

    const field: Field = {
      sample: (x, _y, z) => {
        const u = ((x - WORLD_MIN) / DEFAULT_WORLD_SIZE) * (grid.width - 1);
        const v = ((z - WORLD_MIN) / DEFAULT_WORLD_SIZE) * (grid.height - 1);
        if (!smooth || mode === 1) {
          return cellValue(Math.round(u), Math.round(v)) * hs;
        }
        const x0 = Math.floor(u);
        const y0 = Math.floor(v);
        const fx = u - x0;
        const fy = v - y0;
        const a = cellValue(x0, y0);
        const b = cellValue(x0 + 1, y0);
        const c = cellValue(x0, y0 + 1);
        const d = cellValue(x0 + 1, y0 + 1);
        return (
          (a * (1 - fx) * (1 - fy) +
            b * fx * (1 - fy) +
            c * (1 - fx) * fy +
            d * fx * fy) *
          hs
        );
      },
      dimensionHint: "3d",
    };
    return { out: { type: "field", value: field } };
  },
};
