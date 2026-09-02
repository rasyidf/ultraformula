import type { FormulaParams } from "~/types/Formula";

/**
 * Cellular ("Worley") noise. Space is divided into a unit-cell grid; every cell
 * owns one pseudo-random feature point. For a sample we scan the 3x3x3 block of
 * cells around it (so points just across a cell border still count) and return
 * F2 - F1, the gap between the two nearest feature points — this lights up the
 * cell boundaries.
 */
export class WorleyNoise {
  private static currentSeed = 1;

  static initialize(seed: number) {
    this.currentSeed = Math.floor(seed) || 1;
  }

  static calculate(x: number, y: number, z: number, octaves: number, persistence: number, lacunarity: number, seed: number) {
    const flooredSeed = Math.floor(seed) || 1;
    if (this.currentSeed !== flooredSeed) this.initialize(flooredSeed);

    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Deterministic hash of an integer cell coordinate (+ a channel salt and the
   * current seed) into [0, 1). Replaces the old fixed 32-point table so every
   * cell — including negative coordinates — gets its own stable feature point.
   */
  private static hash(i: number, j: number, k: number, salt: number): number {
    let n = (i * 374761393 + j * 668265263 + k * 1274126177 + salt * 2246822519 + this.currentSeed * 3266489917) | 0;
    n = Math.imul(n ^ (n >>> 15), 2246822519);
    n = Math.imul(n ^ (n >>> 13), 3266489917);
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 4294967296;
  }

  private static noise3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);

    let minDist = Infinity;
    let secondMinDist = Infinity;

    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        for (let dk = -1; dk <= 1; dk++) {
          const cx = xi + di;
          const cy = yi + dj;
          const cz = zi + dk;

          // Feature point lives somewhere inside cell (cx, cy, cz).
          const px = cx + this.hash(cx, cy, cz, 0);
          const py = cy + this.hash(cx, cy, cz, 1);
          const pz = cz + this.hash(cx, cy, cz, 2);

          const dx = px - x;
          const dy = py - y;
          const dz = pz - z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < minDist) {
            secondMinDist = minDist;
            minDist = dist;
          } else if (dist < secondMinDist) {
            secondMinDist = dist;
          }
        }
      }
    }

    return Math.min(1, secondMinDist - minDist);
  }
}
