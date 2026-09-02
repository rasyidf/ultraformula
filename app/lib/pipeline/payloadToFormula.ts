import type { Formula } from "~/types/Formula";
import { bufferGeometryFromData } from "./geometryThree";
import { sampleHeightGrid } from "./ops/erosion";
import type { GridData, RenderPayload } from "./renderPayload";

/**
 * Main-thread half of the `synthesizeFormula` split: wrap a serialisable
 * `RenderPayload` back into the closure/THREE-shaped `Formula` the render views
 * consume. This is the only place downstream of evaluation that touches THREE.
 */

function sampleGrid(grid: GridData, x: number, z: number): number {
  const u = ((x - grid.bounds.minX) / grid.bounds.size) * (grid.width - 1);
  const v = ((z - grid.bounds.minZ) / grid.bounds.size) * (grid.height - 1);
  return sampleHeightGrid(grid.data, grid.width, u, v);
}

export function payloadToFormula(payload: RenderPayload): Formula {
  const baseMeta = {
    name: payload.meta.name,
    description: payload.meta.description,
    parameters: {},
    supportedDimensions: payload.meta.supportedDimensions,
    renderViews: payload.meta.renderViews,
    supportsVertexColors: payload.meta.supportsVertexColors,
  };

  switch (payload.kind) {
    case "scalar":
      return {
        metadata: baseMeta,
        calculate: () => payload.value,
        scalarValue: payload.value,
      };

    case "tilegrid":
      return {
        metadata: baseMeta,
        calculate: () => 0,
        createTileGrid: () => payload.grid,
      };

    case "field":
    case "geometry":
    case "heightmap": {
      const { dataGrid, texture } = payload;
      const geometry = payload.geometry ?? null;
      const formula: Formula = {
        metadata: baseMeta,
        calculate: (p) => sampleGrid(dataGrid, p.x ?? 0, p.z ?? 0),
        createFieldGrid: () => dataGrid,
        createTexture: () => texture,
      };
      if (geometry) {
        formula.createGeometry = () => bufferGeometryFromData(geometry);
      }
      if (payload.kind === "field") {
        const { plot } = payload;
        formula.createPlotData = () => ({
          x: Array.from(plot.x),
          y: Array.from(plot.y),
        });
      }
      return formula;
    }

    default:
      throw new Error("Unsupported render payload");
  }
}
