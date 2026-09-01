import type { NodeDefinition, PortValue } from "../types";

/**
 * Terminal node. Its upstream value is wrapped into a synthetic Formula by
 * `evaluateGraph` (see synthesizeFormula.ts). The active render view is chosen
 * from the viewport toolbar (sceneStore.activeViewId), with `resolveActiveView`
 * falling back when the current view can't display the output.
 */
export const outputNode: NodeDefinition = {
  type: "output",
  label: "Output",
  category: "Output",
  description: "Render the incoming field, heightmap, tile grid or geometry",
  inputs: [{ id: "in", label: "Result", type: "field" }],
  outputs: [],
  params: {},
  evaluate: ({ inputs }): Record<string, PortValue> => {
    return inputs.in ? { in: inputs.in } : {};
  },
};

export const RENDER_VIEW_IDS = ["mesh3d", "plot2d", "tileGrid2d"] as const;
