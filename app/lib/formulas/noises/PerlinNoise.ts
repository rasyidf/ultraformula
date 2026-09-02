
import type { FormulaParams } from "~/types/Formula";

/**
 * How successive octaves are combined:
 * - "standard":  raw fractional Brownian motion (rolling hills)
 * - "ridged":    invert |noise| so zero-crossings become sharp crests (mountains)
 * - "billowed":  take |noise| so crossings become rounded lobes (dunes / clouds)
 */
export type FbmMode = "standard" | "ridged" | "billowed";

export class PerlinNoise {
  private static gradients: number[][] = [];
  private static permutation: number[] = [];
  private static currentSeed: number | null = null;

  static initialize(seed: number) {
    seed = Math.floor(seed) || 1;

    // Park–Miller LCG, same pattern as SimplexNoise / WorleyNoise so a given
    // seed is reproducible across all three noise types.
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const random = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    // Unit gradient vectors, uniformly distributed on the sphere.
    this.gradients = [];
    for (let i = 0; i < 256; i++) {
      const theta = Math.acos(2 * random() - 1);
      const phi = 2 * Math.PI * random();
      this.gradients.push([
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
      ]);
    }

    // Fisher–Yates shuffle of 0..255, then duplicate into a 512-entry table so
    // that reads like permutation[X + 1] with X up to 255 never fall off the end.
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.permutation = new Array(512);
    for (let i = 0; i < 512; i++) this.permutation[i] = p[i & 255];

    this.currentSeed = seed;
  }

  static calculate(
    x: number,
    y: number,
    z: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
    seed: number,
    fbmMode: FbmMode = "standard",
  ) {
    const flooredSeed = Math.floor(seed) || 1;
    if (this.currentSeed !== flooredSeed) this.initialize(flooredSeed);

    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise3D(x * frequency, y * frequency, z * frequency);
      total += this.shape(n, fbmMode) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // maxValue is the geometric series sum; dividing keeps the result in ~[-1, 1]
    // regardless of octave count.
    return total / maxValue;
  }

  /** Per-octave reshaping that turns plain fBm into the three classic looks. */
  private static shape(n: number, mode: FbmMode): number {
    switch (mode) {
      case "ridged":
        // 1 - |n| peaks where the raw noise crosses zero; re-centre to [-1, 1].
        return (1 - Math.abs(n)) * 2 - 1;
      case "billowed":
        return Math.abs(n) * 2 - 1;
      default:
        return n;
    }
  }

  private static noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x - 1, y, z)
        ),
        this.lerp(u,
          this.grad(this.permutation[AB], x, y - 1, z),
          this.grad(this.permutation[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA + 1], x, y, z - 1),
          this.grad(this.permutation[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(u,
          this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
          this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  }

  private static fade(t: number): number {
    // Improved quintic curve for smoother interpolation
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private static grad(hash: number, x: number, y: number, z: number): number {
    const gradient = this.gradients[hash & 255];
    return gradient[0] * x + gradient[1] * y + gradient[2] * z;
  }
}
