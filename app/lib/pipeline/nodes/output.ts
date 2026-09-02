import {
  applyHeightColors,
  COLOR_MAP_IDS,
  COLOR_MAP_LABELS,
  colorMapIdFromIndex,
} from "../colorMaps";
import { DEFAULT_WORLD_SIZE } from "../ops/erosion";
import {
  geometryFromHeightmap,
  gridGeometryFromField,
} from "../ops/fieldToGeometry";
import { planetGeometryFromField } from "../ops/sphereGeometry";
import type { NodeDefinition, PortValue } from "../types";
import { expectField, num, select } from "./_shared";

/**
 * Colorize — field | heightmap → geometry. Builds the surface mesh and paints
 * per-vertex colours from a height ramp / biome theme. This is the "texture"
 * stage; sea / plateau levels come from a Threshold node upstream, vertical
 * scale from a Heightmap node upstream.
 *
 * The `resolution` / `world size` / `height scale` params only apply on the
 * raw-field path; with a Heightmap wired in they're hidden (`inactiveParams`)
 * since that node already fixes mesh density, extent and vertical scale.
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
    resolution: num("resolution", {
      min: 16,
      max: 220,
      step: 4,
      default: 128,
      unit: "px",
      description: "Mesh grid density (raw-field path only).",
    }),
    heightScale: num("height scale", {
      min: 0.1,
      max: 30,
      step: 0.1,
      default: 8,
      description: "Vertical exaggeration (raw-field path only).",
    }),
    worldSize: num("world size", {
      min: 10,
      max: 200,
      step: 2,
      default: DEFAULT_WORLD_SIZE,
      unit: "u",
      description:
        "Side length of the field patch to sample (raw-field path only).",
    }),
  },
  inactiveParams: (connected) =>
    connected.has("heightmap") ? ["resolution", "heightScale", "worldSize"] : [],
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const colorMap = colorMapIdFromIndex(params.colorMap ?? 0);
    const hmInput = inputs.heightmap;
    let data =
      hmInput && hmInput.type === "heightmap"
        ? geometryFromHeightmap(hmInput.value)
        : gridGeometryFromField(expectField(inputs.field, "Colorize"), {
            resolution: Math.round(params.resolution ?? 128),
            heightScale: params.heightScale ?? 8,
            worldSize: params.worldSize ?? DEFAULT_WORLD_SIZE,
          });
    if (colorMap !== "none") data = applyHeightColors(data, { colorMap });
    return { out: { type: "geometry", value: data } };
  },
};

/**
 * Sphere — field → geometry, wrapped radially. Samples a 3D field along each
 * vertex direction of a subdivided icosphere and displaces the vertex outward by
 * the result, pinning anything below the sea threshold to a flat ocean. This is
 * the planet-generation counterpart to Colorize's flat plane; feed it a 3D noise
 * (Perlin Terrain) for continents. Colours are baked here (by elevation, not Y),
 * so it wires straight into Output.
 */
export const sphereNode: NodeDefinition = {
  type: "sphere",
  label: "Sphere",
  category: "Output",
  group: "Shape",
  description: "Wrap a 3D field onto a sphere — radial displacement for planets",
  tags: ["sphere", "planet", "globe", "radial", "world", "icosphere", "ball"],
  inputs: [{ id: "field", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Geometry", type: "geometry" }],
  params: {
    colorMap: select(
      "theme",
      COLOR_MAP_IDS.map((_, i) => i),
      COLOR_MAP_IDS.map((id) => COLOR_MAP_LABELS[id]),
      1,
    ),
    detail: num("detail", {
      min: 1,
      max: 6,
      step: 1,
      default: 4,
      description: "Icosphere subdivisions (4 ≈ 2.5k verts, 6 ≈ 40k).",
    }),
    radius: num("radius", {
      min: 2,
      max: 30,
      step: 0.5,
      default: 10,
      unit: "u",
      description: "Base sphere radius.",
    }),
    heightScale: num("height scale", {
      min: 0,
      max: 12,
      step: 0.1,
      default: 2.5,
      description: "Radial displacement per unit of sampled elevation.",
    }),
    noiseScale: num("feature scale", {
      min: 4,
      max: 120,
      step: 2,
      default: 28,
      unit: "u",
      description:
        "Half-extent of the field patch the sphere samples. Higher = more, smaller continents.",
    }),
    seaLevel: num("sea level", {
      min: 0,
      max: 0.9,
      step: 0.02,
      default: 0.42,
      description: "Fraction of the surface flooded to a flat ocean.",
    }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const field = expectField(inputs.field, "Sphere");
    const geo = planetGeometryFromField(field, {
      subdivisions: Math.round(params.detail ?? 4),
      radius: params.radius ?? 10,
      heightScale: params.heightScale ?? 2.5,
      noiseScale: params.noiseScale ?? 28,
      seaLevel: params.seaLevel ?? 0.42,
      colorMap: colorMapIdFromIndex(params.colorMap ?? 1),
    });
    return { out: { type: "geometry", value: geo } };
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
