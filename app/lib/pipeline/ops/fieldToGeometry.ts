import type { Field, GeometryData, Heightmap } from "../types";
import { DEFAULT_WORLD_SIZE } from "./erosion";

/** Fallback lattice density when a caller doesn't specify `resolution`. */
const DEFAULT_GRID_RES = 50;

/**
 * On-screen footprint of every surface mesh, in world units. The sampled patch
 * (`worldSize` / `Heightmap.bounds`) is always remapped onto this fixed span so
 * the mesh keeps a stable size — and the camera keeps framing it — no matter how
 * wide an area of the field a bake node captures.
 */
export const DISPLAY_SIZE = 50;

export interface GridGeometryOpts {
  /** vertices per side */
  resolution?: number;
  /** side length of the field patch to sample (mesh is normalised to DISPLAY_SIZE) */
  worldSize?: number;
  /** vertical exaggeration applied to sampled values */
  heightScale?: number;
}

/**
 * Grid sampler: a `resolution` x `resolution` lattice. The field is read over
 * x,z in [-worldSize/2, worldSize/2]; the resulting vertices are placed over the
 * fixed [-DISPLAY_SIZE/2, DISPLAY_SIZE/2] display footprint with
 * y = field.sample(...) * heightScale.
 */
export function gridGeometryFromField(
  field: Field,
  opts: GridGeometryOpts = {},
): GeometryData {
  const res = Math.max(2, Math.round(opts.resolution ?? DEFAULT_GRID_RES));
  const sampleSize = opts.worldSize ?? DEFAULT_WORLD_SIZE;
  const heightScale = opts.heightScale ?? 1;
  const positions = new Float32Array(res * res * 3);
  const indices: number[] = [];
  const sampleStep = sampleSize / (res - 1);
  const dispStep = DISPLAY_SIZE / (res - 1);

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const sx = -sampleSize / 2 + i * sampleStep;
      const sz = -sampleSize / 2 + j * sampleStep;
      const y = field.sample(sx, 0, sz) * heightScale;
      const p = (i * res + j) * 3;
      positions[p] = -DISPLAY_SIZE / 2 + i * dispStep;
      positions[p + 1] = y;
      positions[p + 2] = -DISPLAY_SIZE / 2 + j * dispStep;

      if (i < res - 1 && j < res - 1) {
        const a = i * res + j;
        const b = i * res + j + 1;
        const c = (i + 1) * res + j;
        const d = (i + 1) * res + j + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
  }

  return { positions, indices: Uint32Array.from(indices) };
}

export function geometryFromHeightmap(hm: Heightmap): GeometryData {
  const { width, height, data } = hm;
  const positions = new Float32Array(width * height * 3);
  const indices: number[] = [];

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      // Sampled extent (hm.bounds) is normalised onto the fixed display span.
      const x = -DISPLAY_SIZE / 2 + (i / (width - 1)) * DISPLAY_SIZE;
      const z = -DISPLAY_SIZE / 2 + (j / (height - 1)) * DISPLAY_SIZE;
      const p = (j * width + i) * 3;
      positions[p] = x;
      positions[p + 1] = data[j * width + i];
      positions[p + 2] = z;

      if (i < width - 1 && j < height - 1) {
        const a = j * width + i;
        const b = j * width + i + 1;
        const c = (j + 1) * width + i;
        const d = (j + 1) * width + i + 1;
        // CCW winding so computed normals face +Y (up); row-major over x here
        // (vs. column-major in gridGeometryFromField) flips the vertex order.
        indices.push(a, d, b, a, c, d);
      }
    }
  }

  return { positions, indices: Uint32Array.from(indices) };
}

/** Default 2D plot: sample the field along x at y=z=0. */
export function plotFromField(
  field: Field,
  resolution: number,
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  const range = 10;
  for (let i = 0; i <= resolution; i++) {
    const xv = -range / 2 + (i / resolution) * range;
    x.push(xv);
    y.push(field.sample(xv, 0, 0));
  }
  return { x, y };
}
