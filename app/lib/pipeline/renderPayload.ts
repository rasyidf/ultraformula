import type { TileGridResult } from "~/types/Formula";
import { equalizedColors } from "./colorMaps";
import {
  EROSION_WORLD_MIN,
  EROSION_WORLD_SIZE,
  sampleHeightGrid,
} from "./ops/erosion";
import {
  geometryFromHeightmap,
  gridGeometryFromField,
  plotFromField,
} from "./ops/fieldToGeometry";
import type { GeometryData, Heightmap, PortValue } from "./types";

/**
 * A serialisable snapshot of the graph's Output, produced by `evaluateGraph`
 * (worker-side today, WASM-backed later). It carries only plain typed arrays and
 * POJOs — no closures, no THREE — so it survives `postMessage`. The main thread
 * turns it back into a `Formula` via `payloadToFormula`.
 */

export const FIELD_BOUNDS = {
  minX: EROSION_WORLD_MIN,
  minZ: EROSION_WORLD_MIN,
  size: EROSION_WORLD_SIZE,
};

/** Neutral map for raw (un-colorized) field / heightmap previews. */
const RAW_TEXTURE_MAP = "viridis" as const;

/** Materialisation resolutions — the call sites in the render views pass these
 * exact constants today, so baking at fixed size loses nothing. */
export const DATA_GRID_RES = 16;
export const TEXTURE_RES = 320;
export const PLOT_RES = 300;
const FIELD_MESH_RES = 72;
const FIELD_MESH_HEIGHT_SCALE = 6;

export interface GridData {
  width: number;
  height: number;
  /** row-major, length width*height */
  data: Float32Array;
  bounds: { minX: number; minZ: number; size: number };
  /** optional rgb triples (0..1) carried from geometry vertex colours */
  colors?: Float32Array;
}

export interface TextureData {
  width: number;
  height: number;
  /** rgb triples, 0..1, row-major */
  rgb: Float32Array;
}

export interface PayloadMeta {
  name: string;
  description: string;
  supportedDimensions: ("2d" | "3d")[];
  renderViews: string[];
  supportsVertexColors?: boolean;
}

export type RenderPayload =
  | {
      kind: "geometry";
      meta: PayloadMeta;
      geometry: GeometryData;
      dataGrid: GridData;
      texture: TextureData;
    }
  | {
      kind: "heightmap";
      meta: PayloadMeta;
      geometry: GeometryData;
      dataGrid: GridData;
      texture: TextureData;
    }
  | {
      kind: "field";
      meta: PayloadMeta;
      geometry: GeometryData | null;
      /** A parametric formula's mesh, built main-thread in `payloadToFormula`. */
      geometrySpec?: { formula: string; params: Record<string, number> };
      dataGrid: GridData;
      texture: TextureData;
      plot: { x: Float32Array; y: Float32Array };
    }
  | { kind: "tilegrid"; meta: PayloadMeta; grid: TileGridResult }
  | { kind: "scalar"; meta: PayloadMeta; value: number };

function fieldGrid(
  sample: (x: number, y: number, z: number) => number,
  bounds: { minX: number; minZ: number; size: number },
  resolution: number,
): GridData {
  const res = Math.max(2, Math.round(resolution));
  const data = new Float32Array(res * res);
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = bounds.minX + (i / (res - 1)) * bounds.size;
      const z = bounds.minZ + (j / (res - 1)) * bounds.size;
      data[j * res + i] = sample(x, 0, z);
    }
  }
  return { width: res, height: res, data, bounds };
}

/** Top-down max-height raster of arbitrary geometry (carries vertex colour). */
function rasterizeGeometry(geo: GeometryData, resolution: number): GridData {
  const res = Math.max(2, Math.round(resolution));
  const pos = geo.positions;
  const col = geo.colors;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let lowestY = Infinity;
  let lowestColor: [number, number, number] = [0.5, 0.5, 0.5];
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] < minX) minX = pos[i];
    if (pos[i] > maxX) maxX = pos[i];
    if (pos[i + 2] < minZ) minZ = pos[i + 2];
    if (pos[i + 2] > maxZ) maxZ = pos[i + 2];
    if (pos[i + 1] < lowestY) {
      lowestY = pos[i + 1];
      if (col) lowestColor = [col[i], col[i + 1], col[i + 2]];
    }
  }
  const sizeX = maxX - minX || 1;
  const sizeZ = maxZ - minZ || 1;
  const data = new Float32Array(res * res).fill(NaN);
  const colors = col ? new Float32Array(res * res * 3) : undefined;
  for (let i = 0; i < pos.length; i += 3) {
    const u = Math.round(((pos[i] - minX) / sizeX) * (res - 1));
    const v = Math.round(((pos[i + 2] - minZ) / sizeZ) * (res - 1));
    const idx = v * res + u;
    if (Number.isNaN(data[idx]) || pos[i + 1] > data[idx]) {
      data[idx] = pos[i + 1];
      if (colors && col) {
        colors[idx * 3] = col[i];
        colors[idx * 3 + 1] = col[i + 1];
        colors[idx * 3 + 2] = col[i + 2];
      }
    }
  }
  for (let k = 0; k < data.length; k++) {
    if (Number.isNaN(data[k])) {
      data[k] = Number.isFinite(lowestY) ? lowestY : 0;
      if (colors) {
        colors[k * 3] = lowestColor[0];
        colors[k * 3 + 1] = lowestColor[1];
        colors[k * 3 + 2] = lowestColor[2];
      }
    }
  }
  return {
    width: res,
    height: res,
    data,
    colors,
    bounds: { minX, minZ, size: Math.max(sizeX, sizeZ) },
  };
}

function textureFromGrid(grid: GridData): TextureData {
  return {
    width: grid.width,
    height: grid.height,
    rgb: grid.colors ?? equalizedColors(grid.data, { colorMap: RAW_TEXTURE_MAP }),
  };
}

/**
 * Turn the Output node's upstream value into a `RenderPayload`. Lazy fields are
 * materialised here (the point where evaluation used to hand back closures).
 */
export function payloadFromPortValue(value: PortValue): RenderPayload {
  switch (value.type) {
    case "field": {
      const field = value.value;
      const is3d = field.dimensionHint === "3d";
      // A parametric generator defers its mesh (built main-thread, keeps THREE
      // out of the Worker); everything else 3D is grid-sampled here.
      const geometry: GeometryData | null =
        is3d && !field.geometrySpec
          ? gridGeometryFromField(field, {
              resolution: FIELD_MESH_RES,
              heightScale: FIELD_MESH_HEIGHT_SCALE,
            })
          : null;
      const texGrid = fieldGrid(field.sample, FIELD_BOUNDS, TEXTURE_RES);
      const plot = field.makePlot
        ? field.makePlot(PLOT_RES)
        : plotFromField(field, PLOT_RES);
      return {
        kind: "field",
        meta: {
          name: "Pipeline Output",
          description: "Field produced by the node graph",
          supportedDimensions: is3d ? ["3d"] : ["2d"],
          renderViews: [
            ...(is3d ? ["mesh3d"] : []),
            "texture2d",
            "plot2d",
            "data2d",
          ],
          // A deferred parametric mesh may still add colours; `payloadToFormula`
          // updates this once the mesh is built.
          supportsVertexColors: !!geometry?.colors,
        },
        geometry,
        geometrySpec: field.geometrySpec,
        dataGrid: fieldGrid(field.sample, FIELD_BOUNDS, DATA_GRID_RES),
        texture: textureFromGrid(texGrid),
        plot: {
          x: Float32Array.from(plot.x),
          y: Float32Array.from(plot.y),
        },
      };
    }

    case "heightmap": {
      const hm = value.value as Heightmap;
      const geometry = geometryFromHeightmap(hm);
      const sampleHm = (x: number, _y: number, z: number) => {
        const u = ((x - hm.bounds.minX) / hm.bounds.size) * (hm.width - 1);
        const v = ((z - hm.bounds.minZ) / hm.bounds.size) * (hm.height - 1);
        return sampleHeightGrid(hm.data, hm.width, u, v);
      };
      return {
        kind: "heightmap",
        meta: {
          name: "Pipeline Output",
          description: "Heightmap produced by the node graph",
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d", "texture2d", "data2d"],
        },
        geometry,
        dataGrid: fieldGrid(sampleHm, hm.bounds, DATA_GRID_RES),
        texture: textureFromGrid(fieldGrid(sampleHm, hm.bounds, TEXTURE_RES)),
      };
    }

    case "tilegrid": {
      return {
        kind: "tilegrid",
        meta: {
          name: "Pipeline Output",
          description: "Tile grid produced by the node graph",
          supportedDimensions: ["2d"],
          renderViews: ["tileGrid2d", "data2d"],
        },
        grid: value.value,
      };
    }

    case "geometry": {
      const geometry = value.value;
      return {
        kind: "geometry",
        meta: {
          name: "Pipeline Output",
          description: "Geometry produced by the node graph",
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d", "texture2d", "data2d"],
          supportsVertexColors: !!geometry.colors,
        },
        geometry,
        dataGrid: rasterizeGeometry(geometry, DATA_GRID_RES),
        texture: textureFromGrid(rasterizeGeometry(geometry, TEXTURE_RES)),
      };
    }

    case "number": {
      return {
        kind: "scalar",
        meta: {
          name: "Pipeline Output",
          description: "Scalar value produced by the node graph",
          supportedDimensions: ["2d"],
          renderViews: ["data2d"],
        },
        value: value.value,
      };
    }

    default:
      throw new Error("Unsupported output value");
  }
}
