import { PerlinNoise } from './PerlinNoise';
import { Formula } from './useFormula';

export const formulas: Record<string, Formula> = {
  gielis: {
    metadata: {
      name: "Gielis",
      description: "A variation of the superformula",
      parameters: {
        a: {
          name: "a",
          description: "First symmetry parameter",
          min: 0.1,
          max: 10,
          step: 0.1,
          isLocked: false
        },
        b: {
          name: "b",
          description: "Second symmetry parameter",
          min: 0.1,
          max: 10,
          step: 0.1,
          isLocked: false
        },
        m: {
          name: "m",
          description: "Rotational symmetry",
          min: 0,
          max: 20,
          step: 1,
          isLocked: false
        },
        n1: {
          name: "n1",
          description: "Overall shape parameter",
          min: 0.1,
          max: 10,
          step: 0.1,
          isLocked: false
        },
      }
    },
    calculate: ({ phi, a, b, m, n1, n2, n3 }) => {
      return Math.pow(
        Math.pow(Math.abs(Math.cos((m * phi) / 4) / a), n2) +
        Math.pow(Math.abs(Math.sin((m * phi) / 4) / b), n3),
        -1 / n1
      );
    }
  },
  terrainGen: {
    metadata: {
      name: "Perlin Noise",
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
        },
      }
    },
    calculate: ({ x, y, z, scale, octaves, persistence, lacunarity, seed }) => {
      return PerlinNoise.calculate(x / scale, y / scale, z / scale, octaves, persistence, lacunarity, seed);
    }
  },
};
