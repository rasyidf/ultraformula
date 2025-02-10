import { FormulaParams } from "@/types/Formula";
import * as THREE from "three";

export class WorleyNoise {
  private static featurePoints: Array<[number, number, number]> = [];
  private static numPoints = 32;

  static initialize(seed: number) {
    this.featurePoints = [];
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Generate random feature points in [0,1] range instead of [0,256]
    for (let i = 0; i < this.numPoints; i++) {
      this.featurePoints.push([
        random(),
        random(),
        random()
      ]);
    }
  }

  static calculate(x: number, y: number, z: number, octaves: number, persistence: number, lacunarity: number, seed: number) {
    if (this.featurePoints.length === 0) this.initialize(seed);

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

  static createTerrainGeometry(params: FormulaParams, calculateFormula: (params: FormulaParams) => number) {
    const gridSize = 50;
    const vertices = [];
    const indices = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2);
        const z = (j - gridSize / 2);
        const y = calculateFormula({ ...params, x, y: 0, z });

        vertices.push(x, y, z);

        if (i < gridSize - 1 && j < gridSize - 1) {
          const a = i * gridSize + j;
          const b = i * gridSize + j + 1;
          const c = (i + 1) * gridSize + j;
          const d = (i + 1) * gridSize + j + 1;

          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private static noise3D(x: number, y: number, z: number): number {
    let minDist = Infinity;
    let secondMinDist = Infinity;

    // Check against all feature points directly
    for (const point of this.featurePoints) {
      const dx = point[0] - (x % 1);
      const dy = point[1] - (y % 1);
      const dz = point[2] - (z % 1);
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }

    // Normalize the output to [0,1] range
    return Math.min(1, (secondMinDist - minDist));
  }
}


