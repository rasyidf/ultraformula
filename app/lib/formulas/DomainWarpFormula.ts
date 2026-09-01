import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import { PerlinNoise } from "./noises/PerlinNoise";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

/**
 * Domain warping: instead of sampling noise at a point, first *move* the point
 * by the output of another noise call, then sample there.
 *
 *   q      = ( fbm(p + o1), fbm(p + o2), fbm(p + o3) )   // a vector-valued noise
 *   height = fbm( p + strength * q )
 *
 * The offsets o1..o3 are arbitrary constants that decorrelate the three channels
 * of `q` so the warp pushes in a genuinely different direction per axis. One
 * extra layer of indirection turns generic, isotropic Perlin into something that
 * reads as wind-eroded ridges and carved valleys.
 *
 * Reference: Inigo Quilez, "domain warping" (iquilezles.org/articles/warp).
 */
export class DomainWarpFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Domain Warp Terrain",
    description: "Perlin fBm whose sample coordinates are displaced by a second noise field",
    supportedDimensions: ["3d"],
    categories: ["Noise", "Terrain", "3D"],
    tags: ["domain warp", "perlin", "fbm", "terrain", "erosion", "procedural"],
    parameters: {
      scale: {
        name: "scale",
        description: "Size of the terrain features",
        min: 1,
        max: 100,
        step: 1,
        default: 30,
        isLocked: false
      },
      octaves: {
        name: "octaves",
        description: "Number of fBm octaves",
        min: 1,
        max: 10,
        step: 1,
        default: 5,
        isLocked: false
      },
      persistence: {
        name: "persistence",
        description: "Amplitude falloff per octave",
        min: 0.1,
        max: 1,
        step: 0.1,
        default: 0.5,
        isLocked: false
      },
      lacunarity: {
        name: "lacunarity",
        description: "Frequency growth per octave",
        min: 1,
        max: 10,
        step: 1,
        default: 2,
        isLocked: false
      },
      seed: {
        name: "seed",
        description: "Seed for the noise",
        min: 0,
        max: 1000,
        step: 1,
        default: 42,
        isLocked: false
      },
      warpStrength: {
        name: "warp strength",
        description: "How far the coordinates are displaced before sampling (0 = plain fBm)",
        min: 0,
        max: 4,
        step: 0.05,
        default: 1.2,
        isLocked: false
      },
      warpScale: {
        name: "warp scale",
        description: "Frequency of the warp field relative to the base (low = broad swirls, high = fine crinkle)",
        min: 0.1,
        max: 4,
        step: 0.1,
        default: 0.5,
        isLocked: false
      },
      heightScale: {
        name: "height scale",
        description: "Vertical exaggeration of the resulting heightmap",
        min: 1,
        max: 30,
        step: 1,
        default: 10,
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const {
      x = 0,
      y = 0,
      z = 0,
      scale,
      octaves,
      persistence,
      lacunarity,
      seed,
      warpStrength = 1.2,
      warpScale = 0.5,
      heightScale = 10
    } = params;

    const fbm = (fx: number, fy: number, fz: number) =>
      PerlinNoise.calculate(fx, fy, fz, octaves, persistence, lacunarity, seed);

    // Base coordinate, in "feature" units.
    const px = x / scale;
    const py = y / scale;
    const pz = z / scale;

    // Warp field, sampled at a lower/higher frequency and with per-axis offsets.
    const wx = px * warpScale;
    const wy = py * warpScale;
    const wz = pz * warpScale;
    const qx = fbm(wx, wy, wz);
    const qy = fbm(wx + 5.2, wy + 1.3, wz + 2.8);
    const qz = fbm(wx + 1.7, wy + 9.2, wz + 3.4);

    // Sample the base field at the displaced position.
    const height = fbm(
      px + warpStrength * qx,
      py + warpStrength * qy,
      pz + warpStrength * qz
    );

    return height * heightScale;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return PerlinNoise.createTerrainGeometry(params, this.calculate.bind(this));
  }
}
