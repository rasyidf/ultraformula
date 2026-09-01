import {
  applyHeightColors,
  COLOR_MAP_IDS,
  COLOR_MAP_LABELS,
  colorMapIdFromIndex,
} from "../colorMaps";
import {
  EROSION_WORLD_MIN,
  EROSION_WORLD_SIZE,
  materializeField,
} from "../ops/erosion";
import {
  geometryFromHeightmap,
  gridGeometryFromField,
} from "../ops/fieldToGeometry";
import { thermalErode } from "../ops/thermalErosion";
import type { Heightmap, NodeDefinition, PortValue } from "../types";
import { expectField, num, select } from "./_shared";

const WORLD_BOUNDS = {
  minX: EROSION_WORLD_MIN,
  minZ: EROSION_WORLD_MIN,
  size: EROSION_WORLD_SIZE,
};

/** field -> heightmap: bake a lazy field to a grid so downstream reuse is cheap. */
export const materializeNode: NodeDefinition = {
  type: "materialize",
  label: "Materialize",
  category: "Simulation",
  description: "Bake a field to a fixed-resolution heightmap grid",
  tags: ["materialize", "bake", "heightmap", "grid", "cache"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    resolution: num("resolution", { min: 32, max: 256, step: 8, default: 128 }),
    heightScale: num("height scale", { min: 0.1, max: 30, step: 0.1, default: 4 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Materialize");
    const res = Math.min(256, Math.max(8, Math.round(params.resolution ?? 128)));
    const scale = params.heightScale ?? 4;
    const data = materializeField(input.sample, res);
    for (let i = 0; i < data.length; i++) data[i] *= scale;
    const hm: Heightmap = { width: res, height: res, data, bounds: WORLD_BOUNDS };
    return { out: { type: "heightmap", value: hm } };
  },
};

/** field -> heightmap: talus-angle slope relaxation. */
export const thermalErosionNode: NodeDefinition = {
  type: "thermalErosion",
  label: "Thermal Erosion",
  category: "Simulation",
  description: "Relax slopes past the talus angle into rounded scree",
  tags: ["thermal", "talus", "erosion", "scree", "slope", "simulation"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    heightScale: num("height scale", { min: 1, max: 30, step: 1, default: 8 }),
    resolution: num("resolution", { min: 32, max: 200, step: 8, default: 128 }),
    iterations: num("iterations", { min: 0, max: 200, step: 5, default: 40 }),
    talus: num("talus angle", { min: 0.01, max: 3, step: 0.01, default: 0.6 }),
    strength: num("strength", { min: 0, max: 1, step: 0.05, default: 0.5 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Thermal Erosion");
    const res = Math.min(200, Math.max(8, Math.round(params.resolution ?? 128)));
    const scale = params.heightScale ?? 8;
    const data = materializeField(input.sample, res);
    for (let i = 0; i < data.length; i++) data[i] *= scale;
    thermalErode(data, res, params);
    const hm: Heightmap = { width: res, height: res, data, bounds: WORLD_BOUNDS };
    return { out: { type: "heightmap", value: hm } };
  },
};

/** field | heightmap -> geometry: explicit control over the output mesh. */
export const meshifyNode: NodeDefinition = {
  type: "meshify",
  label: "Meshify",
  category: "Output",
  description: "Turn a field or heightmap into a mesh with explicit resolution",
  tags: ["mesh", "geometry", "surface", "displace"],
  inputs: [
    { id: "field", label: "Field", type: "field" },
    { id: "heightmap", label: "Heightmap", type: "heightmap" },
  ],
  outputs: [{ id: "out", label: "Geometry", type: "geometry" }],
  params: {
    resolution: num("resolution", { min: 16, max: 220, step: 4, default: 96 }),
    heightScale: num("height scale", { min: 0.1, max: 30, step: 0.1, default: 8 }),
    worldSize: num("world size", { min: 10, max: 100, step: 1, default: 50 }),
    colorMap: select(
      "colour map",
      COLOR_MAP_IDS.map((_, i) => i),
      COLOR_MAP_IDS.map((id) => COLOR_MAP_LABELS[id]),
      1,
    ),
    waterLevel: num("water level", { min: 0, max: 0.6, step: 0.02, default: 0 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const colorMap = colorMapIdFromIndex(params.colorMap ?? 0);
    const waterLevel = params.waterLevel ?? 0;
    const hmInput = inputs.heightmap;
    let data =
      hmInput && hmInput.type === "heightmap"
        ? geometryFromHeightmap(hmInput.value)
        : gridGeometryFromField(expectField(inputs.field, "Meshify"), {
            resolution: Math.round(params.resolution ?? 96),
            heightScale: params.heightScale ?? 8,
            worldSize: params.worldSize ?? 50,
          });
    if (colorMap !== "none") data = applyHeightColors(data, { colorMap, waterLevel });
    return { out: { type: "geometry", value: data } };
  },
};
