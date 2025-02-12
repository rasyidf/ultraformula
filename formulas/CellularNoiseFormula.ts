import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import { BaseFormula } from "./BaseFormula";
// Assume WorleyNoise is implemented similar to your PerlinNoise
import { WorleyNoise } from "./noises/WorleyNoise";

export class CellularNoiseFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Cellular Pattern",
    description: "Worley noise cellular structure",
    parameters: {
      scale: {
        name: "Scale",
        min: 0.1,
        max: 10,
        step: 0.1,
        description: "Cell size",
        isLocked: false
      },
      octaves: {
        name: "Octaves",
        min: 1,
        max: 8,
        step: 1,
        description: "Noise complexity",
        isLocked: false
      },
      persistence: {
        name: "Persistence",
        min: 0.1,
        max: 1,
        step: 0.1,
        description: "Noise decay",
        isLocked: false
      },
      lacunarity: {
        name: "Lacunarity",
        min: 1,
        max: 3,
        step: 0.1,
        description: "Noise frequency",
        isLocked: false
      },
      seed: {
        name: "Seed",
        min: 0,
        max: 9999,
        step: 1,
        description: "Random variation",
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, scale, seed, octaves, persistence, lacunarity } = params;
    // Amplify the result to make it more visible
    return WorleyNoise.calculate(
      (x || 0) / scale,
      (y || 0) / scale,
      (z || 0) / scale,
      octaves,
      persistence,
      lacunarity,
      seed
    ) * 2; // Multiply by 2 to make the pattern more visible
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return WorleyNoise.createTerrainGeometry(params, (p) => this.calculate(p));
  }
}