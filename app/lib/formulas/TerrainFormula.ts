import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import { PerlinNoise, type FbmMode } from "./noises/PerlinNoise";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

const FBM_MODES: FbmMode[] = ["standard", "ridged", "billowed"];

export class TerrainFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Perlin Noise Terrain",
    description: "Generate terrain using perlin noise",
    supportedDimensions: ['3d'],
    categories: ["Noise", "Terrain", "3D"],
    tags: ["perlin", "terrain", "noise", "procedural", "landscape"],
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
      },
      fbmMode: {
        name: "fBm mode",
        description: "How octaves combine: rolling hills, sharp ridges, or rounded dunes",
        min: 0,
        max: 2,
        step: 1,
        default: 0,
        controlType: "select",
        choices: [0, 1, 2],
        choiceLabels: ["Standard (hills)", "Ridged (mountains)", "Billowed (dunes)"],
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x = 0, y = 0, z = 0, scale, octaves, persistence, lacunarity, seed, fbmMode = 0 } = params;
    const mode = FBM_MODES[Math.min(FBM_MODES.length - 1, Math.max(0, Math.round(fbmMode)))];
    return PerlinNoise.calculate(x / scale, y / scale, z / scale, octaves, persistence, lacunarity, seed, mode);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return PerlinNoise.createTerrainGeometry(params, this.calculate.bind(this));
  }
}
