import {
  erode,
  EROSION_WORLD_MIN,
  EROSION_WORLD_SIZE,
  materializeField,
} from "../ops/erosion";
import type { NodeDefinition } from "../types";
import { expectField, num } from "./_shared";

export const erosionNode: NodeDefinition = {
  type: "erosion",
  label: "Hydraulic Erosion",
  category: "Simulation",
  description: "Materialize the input field to a grid, then run a droplet erosion sim",
  tags: ["erosion", "hydraulic", "droplet", "simulation"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Heightmap", type: "heightmap" }],
  params: {
    heightScale: num("height scale", { min: 1, max: 30, step: 1, default: 12 }),
    resolution: num("grid resolution", { min: 32, max: 160, step: 8, default: 96 }),
    iterations: num("droplets", { min: 0, max: 120000, step: 2000, default: 40000 }),
    erosionRate: num("erosion rate", { min: 0, max: 1, step: 0.05, default: 0.3 }),
    depositionRate: num("deposition rate", { min: 0, max: 1, step: 0.05, default: 0.3 }),
    evaporationRate: num("evaporation rate", { min: 0.001, max: 0.1, step: 0.001, default: 0.02 }),
    seed: num("seed", { min: 0, max: 1000, step: 1, default: 42 }),
  },
  evaluate: ({ inputs, params }) => {
    const input = expectField(inputs.in, "Hydraulic Erosion");
    const res = Math.min(200, Math.max(8, Math.round(params.resolution ?? 96)));
    const heightScale = params.heightScale ?? 12;

    const data = materializeField(input.sample, res);
    for (let i = 0; i < data.length; i++) data[i] *= heightScale;
    erode(data, res, params);

    return {
      out: {
        type: "heightmap",
        value: {
          width: res,
          height: res,
          data,
          bounds: {
            minX: EROSION_WORLD_MIN,
            minZ: EROSION_WORLD_MIN,
            size: EROSION_WORLD_SIZE,
          },
        },
      },
    };
  },
};
