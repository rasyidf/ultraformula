import type { Field, GeometryData, Heightmap } from "../types";

const GRID_SIZE = 50;

export interface GridGeometryOpts {
  /** vertices per side */
  resolution?: number;
  /** world width of the plane */
  worldSize?: number;
  /** vertical exaggeration applied to sampled values */
  heightScale?: number;
}

/**
 * Grid sampler, mirroring PerlinNoise.createTerrainGeometry: a `resolution` x
 * `resolution` lattice over x,z in [-worldSize/2, worldSize/2] with
 * y = field.sample(x, 0, z) * heightScale.
 */
export function gridGeometryFromField(
  field: Field,
  opts: GridGeometryOpts = {},
): GeometryData {
  const res = Math.max(2, Math.round(opts.resolution ?? GRID_SIZE));
  const worldSize = opts.worldSize ?? GRID_SIZE;
  const heightScale = opts.heightScale ?? 1;
  const positions = new Float32Array(res * res * 3);
  const indices: number[] = [];
  const step = worldSize / (res - 1);

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const x = -worldSize / 2 + i * step;
      const z = -worldSize / 2 + j * step;
      const y = field.sample(x, 0, z) * heightScale;
      const p = (i * res + j) * 3;
      positions[p] = x;
      positions[p + 1] = y;
      positions[p + 2] = z;

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
  const { width, height, data, bounds } = hm;
  const positions = new Float32Array(width * height * 3);
  const indices: number[] = [];

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = bounds.minX + (i / (width - 1)) * bounds.size;
      const z = bounds.minZ + (j / (height - 1)) * bounds.size;
      const p = (j * width + i) * 3;
      positions[p] = x;
      positions[p + 1] = data[j * width + i];
      positions[p + 2] = z;

      if (i < width - 1 && j < height - 1) {
        const a = j * width + i;
        const b = j * width + i + 1;
        const c = (j + 1) * width + i;
        const d = (j + 1) * width + i + 1;
        indices.push(a, b, d, a, d, c);
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
