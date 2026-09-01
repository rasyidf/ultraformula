import type { Field, GeometryData, Heightmap } from "../types";

const GRID_SIZE = 50;

/**
 * Grid sampler, mirroring PerlinNoise.createTerrainGeometry: a GRID_SIZE x
 * GRID_SIZE lattice over x,z in [-25, 25) with y = field.sample(x, 0, z).
 */
export function gridGeometryFromField(field: Field): GeometryData {
  const size = GRID_SIZE;
  const positions = new Float32Array(size * size * 3);
  const indices: number[] = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = i - size / 2;
      const z = j - size / 2;
      const y = field.sample(x, 0, z);
      const p = (i * size + j) * 3;
      positions[p] = x;
      positions[p + 1] = y;
      positions[p + 2] = z;

      if (i < size - 1 && j < size - 1) {
        const a = i * size + j;
        const b = i * size + j + 1;
        const c = (i + 1) * size + j;
        const d = (i + 1) * size + j + 1;
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
