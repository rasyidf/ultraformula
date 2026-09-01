import type { NodeDefinition, PortValue } from "../types";

/**
 * Terminal node. Its upstream value is wrapped into a synthetic Formula by
 * `evaluateGraph` (see synthesizeFormula.ts) and shown in the viewport. It is
 * theme-agnostic: colour comes from a Colorize node, levels from a Threshold
 * node upstream.
 */
export const outputNode: NodeDefinition = {
  type: "output",
  label: "Output",
  category: "Output",
  description: "Render the incoming field, heightmap, tile grid, geometry or value",
  inputs: [{ id: "in", label: "Result", type: "field" }],
  outputs: [],
  params: {},
  evaluate: ({ inputs }): Record<string, PortValue> => {
    return inputs.in ? { in: inputs.in } : {};
  },
};

export const RENDER_VIEW_IDS = ["mesh3d", "plot2d", "tileGrid2d"] as const;
