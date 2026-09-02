import type { Formula } from "~/types/Formula";
import type { Field, NodeDefinition, PortValue } from "../types";

/**
 * Wrap an existing Formula class as a generator node. Its metadata parameters
 * become node params; it outputs a `field` (backed by `formula.calculate`), or a
 * `tilegrid` when the formula implements `createTileGrid` (WFC).
 */
export interface GeneratorOptions {
  /**
   * True for x/z scalar fields (Perlin, Worley): grid-sample the field with
   * vertical exaggeration instead of treating it as a parametric surface.
   */
  terrainLike?: boolean;
}

export function formulaAsGeneratorNode(
  key: string,
  formula: Formula,
  opts: GeneratorOptions = {},
): NodeDefinition {
  const meta = formula.metadata;
  const hasTileGrid = typeof formula.createTileGrid === "function";
  const is3d = meta.supportedDimensions.includes("3d");
  // Parametric formulas (Gielis, Torus, …) carry their own display mesh, built
  // main-thread from this key. Noise-like generators are grid-sampled instead.
  const useOwnGeometry = is3d && !opts.terrainLike && !hasTileGrid;
  const isNoise = !!meta.categories?.includes("Noise");

  return {
    type: `gen:${key}`,
    label: meta.name,
    category: isNoise ? "Noise" : "Generator",
    group: isNoise ? undefined : hasTileGrid ? "Tiles" : "Parametric",
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
        geometrySpec: useOwnGeometry
          ? { formula: key, params: { ...params } }
          : undefined,
        makePlot: formula.createPlotData
          ? (res) => formula.createPlotData!(params, res)
          : undefined,
      };
      return { field: { type: "field", value: field } };
    },
  };
}
