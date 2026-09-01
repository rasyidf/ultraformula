import type { Formula, FormulaParams } from "~/types/Formula";
import { bufferGeometryFromData } from "./geometryThree";
import {
  geometryFromHeightmap,
  gridGeometryFromField,
  plotFromField,
} from "./ops/fieldToGeometry";
import { sampleHeightGrid } from "./ops/erosion";
import type { GeometryData, PortValue } from "./types";

/**
 * Wrap the OutputNode's upstream value in a Formula-shaped object that flows
 * unchanged into FormulaCanvasWrapper + the render-view registry.
 */
export function synthesizeFormula(value: PortValue): Formula {
  switch (value.type) {
    case "field": {
      const field = value.value;
      const is3d = field.dimensionHint === "3d";
      const geometryData: GeometryData | null = is3d
        ? field.makeGeometry
          ? field.makeGeometry()
          : gridGeometryFromField(field)
        : null;
      const renderViews = is3d
        ? field.makePlot
          ? ["mesh3d", "plot2d"]
          : ["mesh3d"]
        : ["plot2d"];
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
      };
    }

    case "heightmap": {
      const hm = value.value;
      const geometryData = geometryFromHeightmap(hm);
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Heightmap produced by the node graph",
          parameters: {},
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d"],
        },
        calculate: (p: FormulaParams) => {
          const u =
            ((( p.x ?? 0) - hm.bounds.minX) / hm.bounds.size) * (hm.width - 1);
          const v =
            (((p.z ?? 0) - hm.bounds.minZ) / hm.bounds.size) * (hm.height - 1);
          return sampleHeightGrid(hm.data, hm.width, u, v);
        },
        createGeometry: () => bufferGeometryFromData(geometryData),
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
          renderViews: ["tileGrid2d"],
        },
        calculate: () => 0,
        createTileGrid: () => grid,
      };
    }

    case "geometry": {
      const geometryData = value.value;
      return {
        metadata: {
          name: "Pipeline Output",
          description: "Geometry produced by the node graph",
          parameters: {},
          supportedDimensions: ["3d"],
          renderViews: ["mesh3d"],
          supportsVertexColors: !!geometryData.colors,
        },
        calculate: () => 0,
        createGeometry: () => bufferGeometryFromData(geometryData),
      };
    }

    default:
      throw new Error("Unsupported output value");
  }
}
