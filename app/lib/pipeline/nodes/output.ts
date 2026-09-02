import {
  applyHeightColors,
  COLOR_MAP_IDS,
  COLOR_MAP_LABELS,
  colorMapIdFromIndex,
} from "../colorMaps";
import {
  geometryFromHeightmap,
  gridGeometryFromField,
} from "../ops/fieldToGeometry";
import type { NodeDefinition, PortValue } from "../types";
import { expectField, num, select } from "./_shared";

/**
 * Colorize — field | heightmap → geometry. Builds the surface mesh and paints
 * per-vertex colours from a height ramp / biome theme. This is the "texture"
 * stage; sea / plateau levels come from a Threshold node upstream, vertical
 * scale from a Heightmap node upstream.
 */
export const colorizeNode: NodeDefinition = {
  type: "colorize",
  label: "Colorize",
  category: "Output",
  description: "Shade a field / heightmap with a colour-ramp theme (Terrain, Biome, …)",
  tags: ["colour", "color", "texture", "theme", "biome", "shade", "mesh", "hypsometric"],
  inputs: [
    { id: "heightmap", label: "Heightmap", type: "heightmap" },
    { id: "field", label: "Field", type: "field" },
  ],
  outputs: [{ id: "out", label: "Geometry", type: "geometry" }],
  params: {
    colorMap: select(
      "theme",
      COLOR_MAP_IDS.map((_, i) => i),
      COLOR_MAP_IDS.map((id) => COLOR_MAP_LABELS[id]),
      1,
    ),
    resolution: num("resolution", { min: 16, max: 220, step: 4, default: 128 }),
    heightScale: num("height scale", { min: 0.1, max: 30, step: 0.1, default: 8 }),
    worldSize: num("world size", { min: 10, max: 100, step: 1, default: 50 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const colorMap = colorMapIdFromIndex(params.colorMap ?? 0);
    const hmInput = inputs.heightmap;
    let data =
      hmInput && hmInput.type === "heightmap"
        ? geometryFromHeightmap(hmInput.value)
        : gridGeometryFromField(expectField(inputs.field, "Colorize"), {
            resolution: Math.round(params.resolution ?? 128),
            heightScale: params.heightScale ?? 8,
            worldSize: params.worldSize ?? 50,
          });
    if (colorMap !== "none") data = applyHeightColors(data, { colorMap });
    return { out: { type: "geometry", value: data } };
  },
};

/**
 * Output — terminal node. Its upstream value is materialised into a serialisable
 * RenderPayload by `evaluateGraph` (see renderPayload.ts), then rehydrated into a
 * Formula on the main thread (payloadToFormula.ts). Theme-agnostic: colour comes
 * from Colorize.
 */
export const outputNode: NodeDefinition = {
  type: "output",
  label: "Output",
  category: "Output",
  description: "Render the incoming geometry, heightmap, field, tile grid or value",
  inputs: [{ id: "in", label: "Result", type: "field" }],
  outputs: [],
  params: {},
  evaluate: ({ inputs }): Record<string, PortValue> => {
    return inputs.in ? { in: inputs.in } : {};
  },
};
