import {
  DEFAULT_WORLD_SIZE,
  erode,
  materializeField,
  worldBounds,
} from "../ops/erosion";
import { thermalErode } from "../ops/thermalErosion";
import type { Heightmap, NodeDefinition, PortValue } from "../types";
import { expectField, num } from "./_shared";

/** `world size` param — the square footprint each bake node samples over. */
const worldSizeParam = () =>
  num("world size", {
    min: 10,
    max: 200,
    step: 2,
    default: DEFAULT_WORLD_SIZE,
    unit: "u",
    description:
      "Side length of the field patch to bake. Larger = more terrain in view; the mesh is normalised to a fixed on-screen size.",
  });

/** `resolution` param — grid vertices per side, capped by the viewport guard. */
const resolutionParam = (opts: { min: number; max: number; default: number }) =>
  num("resolution", {
    step: 8,
    unit: "px",
    description:
      "Grid samples per side. Clamped by the viewport's simulation resolution cap.",
    ...opts,
  });

/** Sample a field to a fixed-resolution grid, scaled by `heightScale`. */
function bakeGrid(
  sample: (x: number, y: number, z: number) => number,
  res: number,
  heightScale: number,
  worldSize: number,
): Float32Array {
  const data = materializeField(sample, res, worldSize);
  for (let i = 0; i < data.length; i++) data[i] *= heightScale;
  return data;
}

/**
 * Heightmap — bake a lazy field onto a regular grid. This is the canonical
 * field → heightmap step: it fixes the resolution and the vertical scale so
 * everything downstream (Colorize, Output, erosion) works on real heights.
 */
export const heightmapNode: NodeDefinition = {
  type: "heightmap",
  label: "Heightmap",
  category: "Simulation",
  group: "Bake",
  description: "Bake a field to a fixed-resolution height grid (sets the vertical scale)",
  tags: ["heightmap", "materialize", "bake", "grid", "cache", "height", "y"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    resolution: resolutionParam({ min: 32, max: 256, default: 160 }),
    heightScale: num("height scale", { min: 0.5, max: 60, step: 0.5, default: 8 }),
    worldSize: worldSizeParam(),
  },
  evaluate: ({ inputs, params, env }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Heightmap");
    const res = Math.min(
      env.simResolutionCap,
      Math.max(8, Math.round(params.resolution ?? 160)),
    );
    const worldSize = Math.max(2, params.worldSize ?? DEFAULT_WORLD_SIZE);
    const data = bakeGrid(input.sample, res, params.heightScale ?? 8, worldSize);
    const hm: Heightmap = {
      width: res,
      height: res,
      data,
      bounds: worldBounds(worldSize),
    };
    return { out: { type: "heightmap", value: hm } };
  },
};

/** field → heightmap: droplet hydraulic erosion. */
export const erosionNode: NodeDefinition = {
  type: "erosion",
  label: "Hydraulic Erosion",
  category: "Simulation",
  group: "Erosion",
  description: "Bake the field to a grid, then carve it with a droplet erosion sim",
  tags: ["erosion", "hydraulic", "droplet", "rain", "simulation"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    heightScale: num("height scale", { min: 1, max: 40, step: 1, default: 12 }),
    resolution: resolutionParam({ min: 32, max: 200, default: 96 }),
    iterations: num("droplets", { min: 0, max: 120000, step: 2000, default: 40000 }),
    erosionRate: num("erosion rate", { min: 0, max: 1, step: 0.05, default: 0.3 }),
    depositionRate: num("deposition rate", { min: 0, max: 1, step: 0.05, default: 0.3 }),
    evaporationRate: num("evaporation rate", { min: 0.001, max: 0.1, step: 0.001, default: 0.02 }),
    seed: num("seed", { min: 0, max: 1000, step: 1, default: 42 }),
    worldSize: worldSizeParam(),
  },
  evaluate: ({ inputs, params, env }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Hydraulic Erosion");
    const res = Math.min(
      env.simResolutionCap,
      Math.max(8, Math.round(params.resolution ?? 96)),
    );
    const worldSize = Math.max(2, params.worldSize ?? DEFAULT_WORLD_SIZE);
    const data = bakeGrid(input.sample, res, params.heightScale ?? 12, worldSize);
    erode(data, res, params);
    const hm: Heightmap = {
      width: res,
      height: res,
      data,
      bounds: worldBounds(worldSize),
    };
    return { out: { type: "heightmap", value: hm } };
  },
};

/** field → heightmap: talus-angle slope relaxation. */
export const thermalErosionNode: NodeDefinition = {
  type: "thermalErosion",
  label: "Thermal Erosion",
  category: "Simulation",
  group: "Erosion",
  description: "Relax slopes past the talus angle into rounded scree",
  tags: ["thermal", "talus", "erosion", "scree", "slope", "simulation"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    heightScale: num("height scale", { min: 1, max: 40, step: 1, default: 8 }),
    resolution: resolutionParam({ min: 32, max: 200, default: 128 }),
    iterations: num("iterations", { min: 0, max: 200, step: 5, default: 40 }),
    talus: num("talus angle", { min: 0.01, max: 3, step: 0.01, default: 0.6 }),
    strength: num("strength", { min: 0, max: 1, step: 0.05, default: 0.5 }),
    worldSize: worldSizeParam(),
  },
  evaluate: ({ inputs, params, env }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Thermal Erosion");
    const res = Math.min(
      env.simResolutionCap,
      Math.max(8, Math.round(params.resolution ?? 128)),
    );
    const worldSize = Math.max(2, params.worldSize ?? DEFAULT_WORLD_SIZE);
    const data = bakeGrid(input.sample, res, params.heightScale ?? 8, worldSize);
    thermalErode(data, res, params);
    const hm: Heightmap = {
      width: res,
      height: res,
      data,
      bounds: worldBounds(worldSize),
    };
    return { out: { type: "heightmap", value: hm } };
  },
};
