import type { Formula } from "~/types/Formula";
import { geometryDataFromBufferGeometry } from "../geometryThree";
import type { Field, NodeDefinition, PortValue } from "../types";

/**
 * Wrap an existing Formula class as a generator node. Its metadata parameters
 * become node params; it outputs a `field` (backed by `formula.calculate`), or a
 * `tilegrid` when the formula implements `createTileGrid` (WFC).
 */
export function formulaAsGeneratorNode(
  key: string,
  formula: Formula,
): NodeDefinition {
  const meta = formula.metadata;
  const hasTileGrid = typeof formula.createTileGrid === "function";
  const is3d = meta.supportedDimensions.includes("3d");

  return {
    type: `gen:${key}`,
    label: meta.name,
    category: meta.categories?.includes("Noise") ? "Noise" : "Generator",
    description: meta.description,
    tags: meta.tags,
    inputs: [],
    outputs: hasTileGrid
      ? [{ id: "tilegrid", label: "Tiles", type: "tilegrid" }]
      : [{ id: "field", label: "Field", type: "field" }],
    params: meta.parameters,
    evaluate: ({ params }): Record<string, PortValue> => {
      if (hasTileGrid) {
        return {
          tilegrid: { type: "tilegrid", value: formula.createTileGrid!(params) },
        };
      }
      const field: Field = {
        sample: (x, y, z) =>
          formula.calculate({ phi: params.phi ?? 0, ...params, x, y, z }),
        dimensionHint: is3d ? "3d" : "2d",
        makeGeometry: formula.createGeometry
          ? () => geometryDataFromBufferGeometry(formula.createGeometry!(params))
          : undefined,
        makePlot: formula.createPlotData
          ? (res) => formula.createPlotData!(params, res)
          : undefined,
      };
      return { field: { type: "field", value: field } };
    },
  };
}
