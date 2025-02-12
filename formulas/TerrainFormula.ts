import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import { BaseFormula } from "./BaseFormula";
import { PerlinNoise } from "./noises/PerlinNoise";

export class TerrainFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Perlin Noise Terrain",
    description: "Generate terrain using perlin noise",
    parameters: {
      scale: {
        name: "scale",
        description: "Scale of the terrain",
        min: 1,
        max: 100,
        step: 1,
        isLocked: false
      },
      octaves: {
        name: "octaves",
        description: "Number of octaves",
        min: 1,
        max: 10,
        step: 1,
        isLocked: false
      },
      persistence: {
        name: "persistence",
        description: "Persistence of the terrain",
        min: 0.1,
        max: 1,
        step: 0.1,
        isLocked: false
      },
      lacunarity: {
        name: "lacunarity",
        description: "Lacunarity of the terrain",
        min: 1,
        max: 10,
        step: 1,
        isLocked: false
      },
      seed: {
        name: "seed",
        description: "Seed for the terrain",
        min: 0,
        max: 1000,
        step: 1,
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x = 0, y = 0, z = 0, scale, octaves, persistence, lacunarity, seed } = params;
    return PerlinNoise.calculate(x / scale, y / scale, z / scale, octaves, persistence, lacunarity, seed);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return PerlinNoise.createTerrainGeometry(params, this.calculate.bind(this));
  }
}
