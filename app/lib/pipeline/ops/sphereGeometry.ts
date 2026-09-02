import { type ColorMapId, equalizedColors } from "../colorMaps";
import type { Field, GeometryData } from "../types";

/**
 * Radial (planet) mesh builder. A subdivided icosahedron is sampled against a 3D
 * field — one lookup per vertex, along the vertex's own direction — then each
 * vertex is pushed out along that direction by the sampled elevation. Vertices
 * below the sea threshold are pinned to a flat ocean radius. Runs in the
 * evaluation Worker, so it emits plain typed arrays (no THREE); normals are
 * computed main-thread in `bufferGeometryFromData`.
 */

export interface PlanetGeometryOpts {
  /** icosphere subdivision count (0 = 20 faces, 6 ≈ 82k faces) */
  subdivisions?: number;
  /** base sphere radius, in world units */
  radius?: number;
  /** radial displacement per unit of sampled elevation */
  heightScale?: number;
  /**
   * Half-extent (in field space) of the cube the sphere is sampled over — the
   * unit direction is multiplied by this before `field.sample`. Higher = more,
   * smaller features. Comparable to a flat bake's `world size` / 2.
   */
  noiseScale?: number;
  /** fraction of the surface (0..0.95) flooded to a flat sea */
  seaLevel?: number;
  colorMap?: ColorMapId;
}

type Vec3 = [number, number, number];

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Unit-radius icosphere: normalised vertices + triangle indices. */
function icosphere(subdivisions: number): {
  verts: Vec3[];
  faces: Vec3[];
} {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: Vec3[] = (
    [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ] as Vec3[]
  ).map(normalize);

  let faces: Vec3[] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const midCache = new Map<number, number>();
  const midpoint = (a: number, b: number): number => {
    const key = a < b ? a * 1e7 + b : b * 1e7 + a;
    const hit = midCache.get(key);
    if (hit !== undefined) return hit;
    const va = verts[a];
    const vb = verts[b];
    const idx =
      verts.push(normalize([va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]])) - 1;
    midCache.set(key, idx);
    return idx;
  };

  for (let s = 0; s < subdivisions; s++) {
    const next: Vec3[] = [];
    for (const [a, b, c] of faces) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }

  return { verts, faces };
}

/** Value at fractional rank `f` (0..1) of `values`, without mutating it. */
function quantile(values: Float32Array, f: number): number {
  if (values.length === 0) return 0;
  const sorted = Float64Array.from(values).sort();
  const i = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(f * (sorted.length - 1))),
  );
  return sorted[i];
}

export function planetGeometryFromField(
  field: Field,
  opts: PlanetGeometryOpts = {},
): GeometryData {
  const subdivisions = Math.max(0, Math.min(6, Math.round(opts.subdivisions ?? 4)));
  const radius = opts.radius ?? 10;
  const heightScale = opts.heightScale ?? 2.5;
  const noiseScale = opts.noiseScale ?? 28;
  const seaLevel = Math.max(0, Math.min(0.95, opts.seaLevel ?? 0.42));
  const colorMap = opts.colorMap ?? "terrain";

  const { verts, faces } = icosphere(subdivisions);
  const n = verts.length;

  const elevations = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [dx, dy, dz] = verts[i];
    elevations[i] = field.sample(
      dx * noiseScale,
      dy * noiseScale,
      dz * noiseScale,
    );
  }

  // Raw fBm output has a small, seed-dependent amplitude, so normalise the
  // sampled range (2nd..98th percentile) to ~[-1, 1] before displacing. That
  // makes `heightScale` mean "peak relief in world units" regardless of the
  // upstream noise, and lets `seaLevel` (a fraction of that range) match the
  // colour ramp's water cutoff.
  const lo = quantile(elevations, 0.02);
  const span = quantile(elevations, 0.98) - lo || 1;
  const seaN = seaLevel > 0 ? seaLevel * 2 - 1 : -Infinity;

  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [dx, dy, dz] = verts[i];
    const norm = Math.max(-1.5, Math.min(1.5, ((elevations[i] - lo) / span) * 2 - 1));
    const r = radius + Math.max(norm, seaN) * heightScale;
    positions[i * 3] = dx * r;
    positions[i * 3 + 1] = dy * r;
    positions[i * 3 + 2] = dz * r;
  }

  const indices = new Uint32Array(faces.length * 3);
  for (let f = 0; f < faces.length; f++) {
    indices[f * 3] = faces[f][0];
    indices[f * 3 + 1] = faces[f][1];
    indices[f * 3 + 2] = faces[f][2];
  }

  const colors =
    colorMap === "none"
      ? undefined
      : equalizedColors(elevations, { colorMap, waterLevel: seaLevel });

  return { positions, indices, colors };
}
