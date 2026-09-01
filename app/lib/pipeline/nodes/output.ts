import { COLOR_MAP_IDS, COLOR_MAP_LABELS } from "../colorMaps";
import type { NodeDefinition, PortValue } from "../types";
import { num, select } from "./_shared";

/**
 * Terminal node. Its upstream value is wrapped into a synthetic Formula by
 * `evaluateGraph` (see synthesizeFormula.ts). `colorMap` / `waterLevel` bake
 * per-vertex colours onto the output mesh so terrain reads as terrain.
 */
export const outputNode: NodeDefinition = {
  type: "output",
  label: "Output",
  category: "Output",
  description: "Render the incoming field, heightmap, tile grid or geometry",
  inputs: [{ id: "in", label: "Result", type: "field" }],
  outputs: [],
  params: {
    colorMap: select(
      "colour map",
      COLOR_MAP_IDS.map((_, i) => i),
      COLOR_MAP_IDS.map((id) => COLOR_MAP_LABELS[id]),
      1,
    ),
    waterLevel: num("water level", { min: 0, max: 0.6, step: 0.02, default: 0 }),
  },
  evaluate: ({ inputs }): Record<string, PortValue> => {
    return inputs.in ? { in: inputs.in } : {};
  },
};

export const RENDER_VIEW_IDS = ["mesh3d", "plot2d", "tileGrid2d"] as const;
