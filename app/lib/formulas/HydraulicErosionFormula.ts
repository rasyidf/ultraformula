import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import { PerlinNoise } from "./noises/PerlinNoise";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

/**
 * Droplet-based hydraulic erosion.
 *
 * Every formula so far has been a pure function `calculate(x, y, z) -> number`.
 * Erosion doesn't fit that shape: it needs the *whole* heightmap in memory and
 * mutates it over many iterations. So this class builds a grid once from Perlin
 * fBm, rains thousands of water droplets on it — each one rolls downhill,
 * picking up sediment on steep ground and dropping it in hollows — and caches
 * the eroded grid. `calculate` then just bilinearly samples that cache, which
 * keeps it compatible with the existing geometry/colour plumbing.
 *
 * The simulation is the classic Beyer / Lague model:
 * https://www.firespark.de/resources/downloads/implementation%20of%20a%20methode%20for%20hydraulic%20erosion.pdf
 */
export class HydraulicErosionFormula extends BaseFormula {
  // World footprint that `PerlinNoise.createTerrainGeometry` samples: x,z in [-25, 25).
  private static readonly WORLD_MIN = -25;
  private static readonly WORLD_SIZE = 50;

  // Fixed simulation constants (exposing every knob would swamp the UI).
  private static readonly INERTIA = 0.05;            // 0 = follow gradient exactly, 1 = keep going straight
  private static readonly CAPACITY_FACTOR = 4;       // how much sediment fast, steep water can carry
  private static readonly MIN_CAPACITY = 0.01;       // stops carrying capacity collapsing to 0 on flats
  private static readonly DROPLET_LIFETIME = 30;     // max steps before a droplet is abandoned
  private static readonly GRAVITY = 4;
  private static readonly BRUSH_RADIUS = 2;          // erosion is spread over a disc to avoid 1-pixel pits

  private cache: { key: string; res: number; heights: Float32Array } | null = null;

  metadata: FormulaMetadata = {
    name: "Hydraulic Erosion",
    description: "Perlin terrain carved by a droplet erosion simulation",
    supportedDimensions: ["3d"],
    categories: ["Noise", "Terrain", "Simulation", "3D"],
    tags: ["erosion", "hydraulic", "simulation", "terrain", "droplet", "procedural"],
    parameters: {
      scale: {
        name: "scale",
        description: "Size of the base terrain features",
        min: 1, max: 100, step: 1, default: 30, isLocked: false
      },
      octaves: {
        name: "octaves",
        description: "Number of fBm octaves in the base terrain",
        min: 1, max: 10, step: 1, default: 6, isLocked: false
      },
      persistence: {
        name: "persistence",
        description: "Amplitude falloff per octave",
        min: 0.1, max: 1, step: 0.1, default: 0.5, isLocked: false
      },
      lacunarity: {
        name: "lacunarity",
        description: "Frequency growth per octave",
        min: 1, max: 10, step: 1, default: 2, isLocked: false
      },
      seed: {
        name: "seed",
        description: "Seed for both the terrain and the rainfall pattern",
        min: 0, max: 1000, step: 1, default: 42, isLocked: false
      },
      heightScale: {
        name: "height scale",
        description: "Vertical exaggeration of the heightmap",
        min: 1, max: 30, step: 1, default: 12, isLocked: false
      },
      resolution: {
        name: "grid resolution",
        description: "Heightmap size per side (higher = finer detail, slower)",
        min: 32, max: 160, step: 8, default: 96, isLocked: false
      },
      iterations: {
        name: "droplets",
        description: "Number of erosion droplets (0 = raw terrain, no erosion)",
        min: 0, max: 120000, step: 2000, default: 40000, isLocked: false
      },
      erosionRate: {
        name: "erosion rate",
        description: "Fraction of spare capacity removed as sediment each step",
        min: 0, max: 1, step: 0.05, default: 0.3, isLocked: false
      },
      depositionRate: {
        name: "deposition rate",
        description: "Fraction of excess sediment dropped each step",
        min: 0, max: 1, step: 0.05, default: 0.3, isLocked: false
      },
      evaporationRate: {
        name: "evaporation rate",
        description: "Fraction of a droplet's water lost each step",
        min: 0.001, max: 0.1, step: 0.001, default: 0.02, isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x = 0, z = 0 } = params;
    const grid = this.getGrid(params);

    // World coords -> continuous grid coords.
    const u = (x - HydraulicErosionFormula.WORLD_MIN) / HydraulicErosionFormula.WORLD_SIZE * (grid.res - 1);
    const v = (z - HydraulicErosionFormula.WORLD_MIN) / HydraulicErosionFormula.WORLD_SIZE * (grid.res - 1);
    return this.sampleHeight(grid.heights, grid.res, u, v);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return PerlinNoise.createTerrainGeometry(params, this.calculate.bind(this));
  }

  // ---------------------------------------------------------------------------

  private getGrid(params: FormulaParams): { res: number; heights: Float32Array } {
    const {
      scale, octaves, persistence, lacunarity, seed, heightScale,
      resolution, iterations, erosionRate, depositionRate, evaporationRate
    } = params;

    const res = Math.max(8, Math.round(resolution ?? 96));
    const key = JSON.stringify([
      scale, octaves, persistence, lacunarity, seed, heightScale,
      res, Math.round(iterations ?? 0), erosionRate, depositionRate, evaporationRate
    ]);
    if (this.cache && this.cache.key === key) return this.cache;

    const heights = this.buildBaseHeightmap(res, params);
    this.erode(heights, res, params);

    this.cache = { key, res, heights };
    return this.cache;
  }

  private buildBaseHeightmap(res: number, params: FormulaParams): Float32Array {
    const { scale, octaves, persistence, lacunarity, seed, heightScale = 12 } = params;
    const heights = new Float32Array(res * res);
    const { WORLD_MIN, WORLD_SIZE } = HydraulicErosionFormula;

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const worldX = WORLD_MIN + (x / (res - 1)) * WORLD_SIZE;
        const worldZ = WORLD_MIN + (y / (res - 1)) * WORLD_SIZE;
        const h = PerlinNoise.calculate(
          worldX / scale, 0, worldZ / scale,
          octaves, persistence, lacunarity, seed
        );
        heights[y * res + x] = h * heightScale;
      }
    }
    return heights;
  }

  /** Bilinear height lookup, clamped to the grid. */
  private sampleHeight(heights: Float32Array, res: number, u: number, v: number): number {
    const cu = Math.min(Math.max(u, 0), res - 1);
    const cv = Math.min(Math.max(v, 0), res - 1);
    const x0 = Math.floor(cu);
    const y0 = Math.floor(cv);
    const x1 = Math.min(x0 + 1, res - 1);
    const y1 = Math.min(y0 + 1, res - 1);
    const fx = cu - x0;
    const fy = cv - y0;

    const h00 = heights[y0 * res + x0];
    const h10 = heights[y0 * res + x1];
    const h01 = heights[y1 * res + x0];
    const h11 = heights[y1 * res + x1];

    return (
      h00 * (1 - fx) * (1 - fy) +
      h10 * fx * (1 - fy) +
      h01 * (1 - fx) * fy +
      h11 * fx * fy
    );
  }

  private erode(heights: Float32Array, res: number, params: FormulaParams): void {
    const iterations = Math.round(params.iterations ?? 0);
    if (iterations <= 0) return;

    const erosionRate = params.erosionRate ?? 0.3;
    const depositionRate = params.depositionRate ?? 0.3;
    const evaporationRate = params.evaporationRate ?? 0.02;
    const seed = params.seed ?? 42;
    const {
      INERTIA, CAPACITY_FACTOR, MIN_CAPACITY, DROPLET_LIFETIME, GRAVITY, BRUSH_RADIUS
    } = HydraulicErosionFormula;

    // Seeded PRNG so the same params always give the same rain.
    let s = Math.floor(seed * 7919 + 1) % 2147483647;
    if (s <= 0) s += 2147483646;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    // Precompute the erosion brush: a normalised falloff disc.
    const brushDX: number[] = [];
    const brushDY: number[] = [];
    const brushW: number[] = [];
    let brushSum = 0;
    for (let by = -BRUSH_RADIUS; by <= BRUSH_RADIUS; by++) {
      for (let bx = -BRUSH_RADIUS; bx <= BRUSH_RADIUS; bx++) {
        const d = Math.sqrt(bx * bx + by * by);
        if (d > BRUSH_RADIUS) continue;
        brushDX.push(bx);
        brushDY.push(by);
        brushW.push(1 - d / BRUSH_RADIUS);
        brushSum += 1 - d / BRUSH_RADIUS;
      }
    }
    for (let i = 0; i < brushW.length; i++) brushW[i] /= brushSum;

    // Height + gradient at a continuous position via bilinear interpolation.
    const sampleHG = (px: number, py: number) => {
      const x0 = Math.floor(px);
      const y0 = Math.floor(py);
      const fx = px - x0;
      const fy = py - y0;
      const x1 = Math.min(x0 + 1, res - 1);
      const y1 = Math.min(y0 + 1, res - 1);

      const h00 = heights[y0 * res + x0];
      const h10 = heights[y0 * res + x1];
      const h01 = heights[y1 * res + x0];
      const h11 = heights[y1 * res + x1];

      const height =
        h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) +
        h01 * (1 - fx) * fy + h11 * fx * fy;
      const gradX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
      const gradY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;
      return { height, gradX, gradY };
    };

    for (let iter = 0; iter < iterations; iter++) {
      let posX = rand() * (res - 1);
      let posY = rand() * (res - 1);
      let dirX = 0;
      let dirY = 0;
      let speed = 1;
      let water = 1;
      let sediment = 0;

      for (let life = 0; life < DROPLET_LIFETIME; life++) {
        const nodeX = Math.floor(posX);
        const nodeY = Math.floor(posY);
        const cellX = posX - nodeX;
        const cellY = posY - nodeY;

        const { height: oldHeight, gradX, gradY } = sampleHG(posX, posY);

        // Blend the previous direction with the downhill gradient.
        dirX = dirX * INERTIA - gradX * (1 - INERTIA);
        dirY = dirY * INERTIA - gradY * (1 - INERTIA);
        const len = Math.hypot(dirX, dirY);
        if (len !== 0) {
          dirX /= len;
          dirY /= len;
        } else {
          const a = rand() * Math.PI * 2;
          dirX = Math.cos(a);
          dirY = Math.sin(a);
        }

        posX += dirX;
        posY += dirY;

        // Left the map (or nowhere to go): this droplet is done.
        if (posX < 0 || posX >= res - 1 || posY < 0 || posY >= res - 1) break;

        const newHeight = sampleHG(posX, posY).height;
        const deltaHeight = newHeight - oldHeight;

        // Carrying capacity: fast, deep water on steep downhill carries the most.
        const capacity = Math.max(
          -deltaHeight * speed * water * CAPACITY_FACTOR,
          MIN_CAPACITY
        );

        if (sediment > capacity || deltaHeight > 0) {
          // Drop sediment. Going uphill: fill the pit (but not past the rim).
          const amount = deltaHeight > 0
            ? Math.min(deltaHeight, sediment)
            : (sediment - capacity) * depositionRate;
          sediment -= amount;

          // Deposit bilinearly into the 4 nodes of the cell we came from.
          heights[nodeY * res + nodeX] += amount * (1 - cellX) * (1 - cellY);
          heights[nodeY * res + nodeX + 1] += amount * cellX * (1 - cellY);
          heights[(nodeY + 1) * res + nodeX] += amount * (1 - cellX) * cellY;
          heights[(nodeY + 1) * res + nodeX + 1] += amount * cellX * cellY;
        } else {
          // Erode. Never dig deeper than the step down, so the droplet can't
          // carve below where it's heading.
          const amount = Math.min((capacity - sediment) * erosionRate, -deltaHeight);
          let removed = 0;
          for (let i = 0; i < brushW.length; i++) {
            const bx = nodeX + brushDX[i];
            const by = nodeY + brushDY[i];
            if (bx < 0 || bx >= res || by < 0 || by >= res) continue;
            const w = amount * brushW[i];
            heights[by * res + bx] -= w;
            removed += w;
          }
          sediment += removed;
        }

        // Update speed and evaporate water. This is the Beyer/Lague damping term
        // (not literal kinematics) — the max(0,...) keeps it from going complex
        // and stops a long descent from compounding into runaway erosion.
        speed = Math.sqrt(Math.max(0, speed * speed + deltaHeight * GRAVITY));
        water *= 1 - evaporationRate;
        if (water < 1e-4) break;
      }
    }
  }
}
