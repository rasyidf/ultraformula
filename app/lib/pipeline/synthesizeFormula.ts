import type { Formula, FormulaParams } from "~/types/Formula";
import {
  applyHeightColors,
  colorMapIdFromIndex,
  equalizedColors,
} from "./colorMaps";
import { bufferGeometryFromData } from "./geometryThree";
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

export const FIELD_BOUNDS = {
  minX: EROSION_WORLD_MIN,
  minZ: EROSION_WORLD_MIN,
  size: EROSION_WORLD_SIZE,
};

/** Top-down max-height raster of arbitrary geometry (for the 2D views). */
function rasterizeGeometry(geo: GeometryData, resolution: number) {
  const res = Math.max(2, Math.round(resolution));
  const pos = geo.positions;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] < minX) minX = pos[i];
    if (pos[i] > maxX) maxX = pos[i];
    if (pos[i + 2] < minZ) minZ = pos[i + 2];
    if (pos[i + 2] > maxZ) maxZ = pos[i + 2];
  }
  const sizeX = maxX - minX || 1;
  const sizeZ = maxZ - minZ || 1;
  const data = new Float32Array(res * res).fill(NaN);
  for (let i = 0; i < pos.length; i += 3) {
    const u = Math.round(((pos[i] - minX) / sizeX) * (res - 1));
    const v = Math.round(((pos[i + 2] - minZ) / sizeZ) * (res - 1));
    const idx = v * res + u;
    if (Number.isNaN(data[idx]) || pos[i + 1] > data[idx]) data[idx] = pos[i + 1];
  }
  let lowest = Infinity;
  for (const d of data) if (!Number.isNaN(d) && d < lowest) lowest = d;
  if (!Number.isFinite(lowest)) lowest = 0;
  for (let i = 0; i < data.length; i++) if (Number.isNaN(data[i])) data[i] = lowest;
  return {
    width: res,
    height: res,
    data,
    bounds: { minX, minZ, size: Math.max(sizeX, sizeZ) },
  };
}

function fieldGrid(
  sample: (x: number, y: number, z: number) => number,
  bounds: { minX: number; minZ: number; size: number },
  resolution: number,
) {
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

/**
 * Wrap the OutputNode's upstream value in a Formula-shaped object that flows
 * unchanged into FormulaCanvasWrapper + the render-view registry.
 */
export function synthesizeFormula(
  value: PortValue,
  outParams: FormulaParams = {},
): Formula {
  const colorMap = colorMapIdFromIndex(outParams.colorMap ?? 0);
  const waterLevel = outParams.waterLevel ?? 0;
  const textureMap = colorMap === "none" ? "grayscale" : colorMap;

  const shade = (geo: GeometryData): GeometryData => {
    if (geo.colors || colorMap === "none") return geo;
    return applyHeightColors(geo, { colorMap, waterLevel });
  };

  const makeTexture = (
    sample: (x: number, y: number, z: number) => number,
    bounds: { minX: number; minZ: number; size: number },
  ) => (resolution: number) => {
    const grid = fieldGrid(sample, bounds, resolution);
    return {
      width: grid.width,
      height: grid.height,
      rgb: equalizedColors(grid.data, { colorMap: textureMap, waterLevel }),
    };
  };

  switch (value.type) {
    case "field": {
      const field = value.value;
      const is3d = field.dimensionHint === "3d";
      const geometryData: GeometryData | null = is3d
        ? shade(
            field.makeGeometry
              ? field.makeGeometry()
              : gridGeometryFromField(field, { resolution: 72, heightScale: 6 }),
          )
        : null;
      const renderViews = [
        ...(is3d ? ["mesh3d"] : []),
        "texture2d",
        "plot2d",
        "data2d",
      ];
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Field produced by the node graph",
          parameters: {},
          supportedDimensions: is3d ? ["3d"] : ["2d"],
          renderViews,
          supportsVertexColors: !!geometryData?.colors,
        },
        calculate: (p: FormulaParams) => field.sample(p.x ?? 0, p.y ?? 0, p.z ?? 0),
        createGeometry: geometryData
          ? () => bufferGeometryFromData(geometryData)
          : undefined,
        createPlotData: (_p, res) =>
          field.makePlot ? field.makePlot(res) : plotFromField(field, res),
        createFieldGrid: (res) => fieldGrid(field.sample, FIELD_BOUNDS, res),
        createTexture: makeTexture(field.sample, FIELD_BOUNDS),
      };
    }

    case "heightmap": {
      const hm = value.value as Heightmap;
      const geometryData = shade(geometryFromHeightmap(hm));
      const sampleHm = (x: number, _y: number, z: number) => {
        const u = ((x - hm.bounds.minX) / hm.bounds.size) * (hm.width - 1);
        const v = ((z - hm.bounds.minZ) / hm.bounds.size) * (hm.height - 1);
        return sampleHeightGrid(hm.data, hm.width, u, v);
      };
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Heightmap produced by the node graph",
          parameters: {},
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d", "texture2d", "data2d"],
          supportsVertexColors: !!geometryData.colors,
        },
        calculate: (p: FormulaParams) => sampleHm(p.x ?? 0, 0, p.z ?? 0),
        createGeometry: () => bufferGeometryFromData(geometryData),
        createFieldGrid: (res) => fieldGrid(sampleHm, hm.bounds, res),
        createTexture: makeTexture(sampleHm, hm.bounds),
      };
    }

    case "tilegrid": {
      const grid = value.value;
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Tile grid produced by the node graph",
          parameters: {},
          supportedDimensions: ["2d"],
          renderViews: ["tileGrid2d", "data2d"],
        },
        calculate: () => 0,
        createTileGrid: () => grid,
      };
    }

    case "geometry": {
      const geometryData = shade(value.value);
      const raster = rasterizeGeometry(geometryData, 128);
      const sampleRaster = (x: number, _y: number, z: number) => {
        const u = ((x - raster.bounds.minX) / raster.bounds.size) * (raster.width - 1);
        const v = ((z - raster.bounds.minZ) / raster.bounds.size) * (raster.height - 1);
        return sampleHeightGrid(raster.data, raster.width, u, v);
      };
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Geometry produced by the node graph",
          parameters: {},
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d", "texture2d", "data2d"],
          supportsVertexColors: !!geometryData.colors,
        },
        calculate: (p: FormulaParams) => sampleRaster(p.x ?? 0, 0, p.z ?? 0),
        createGeometry: () => bufferGeometryFromData(geometryData),
        createFieldGrid: (res) => {
          const g = rasterizeGeometry(geometryData, res);
          return { ...g, data: g.data };
        },
        createTexture: makeTexture(sampleRaster, raster.bounds),
      };
    }

    case "number": {
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Scalar value produced by the node graph",
          parameters: {},
          supportedDimensions: ["2d"],
          renderViews: ["data2d"],
        },
        calculate: () => value.value,
        scalarValue: value.value,
      };
    }

    default:
      throw new Error("Unsupported output value");
  }
}
