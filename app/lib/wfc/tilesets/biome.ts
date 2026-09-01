import { symmetricAdjacency, type WfcTileset } from "../WaveFunctionCollapse";

/**
 * Terrain / biome tileset. Tiles are ordered as an elevation ramp:
 *
 *   0 deep water  1 shallow water  2 sand  3 grass  4 forest  5 rock
 *
 * Adjacency rule: two tiles may share an edge only if they are at most one step
 * apart on the ramp (|a - b| <= 1). That single constraint is enough to produce
 * smooth coastlines and mountain fringes, and makes "deep water touching rock"
 * structurally impossible.
 */
export const BIOME_TILES = [
  { name: "Deep water", color: "#1d4e89", weight: 2 },
  { name: "Shallow water", color: "#4a90c2", weight: 1.5 },
  { name: "Sand", color: "#e3d59e", weight: 1 },
  { name: "Grass", color: "#6aa84f", weight: 3 },
  { name: "Forest", color: "#2f6b34", weight: 2.5 },
  { name: "Rock", color: "#7a7a7a", weight: 1.5 },
] as const;

export const biomePalette = BIOME_TILES.map((t) => ({
  color: t.color,
  label: t.name,
}));

export const biomeTileset: WfcTileset = {
  tiles: BIOME_TILES.map((t) => ({ weight: t.weight })),
  allowed: symmetricAdjacency(BIOME_TILES.length, (a, b) => Math.abs(a - b) <= 1),
};
