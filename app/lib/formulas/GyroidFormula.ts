import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import { MarchingCubes } from "./MarchingCubes";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GyroidFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gyroid",
    description: "Triply periodic minimal surface",
    parameters: {
      scale: {
        name: "Scale",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 0.2,
        description: "Structure density",
        isLocked: false,
      },
      threshold: {
        name: "Threshold",
        min: -1.5,
        max: 1.5,
        step: 0.1,
        default: 2,
        description: "Surface boundary",
        isLocked: false,
      },
      resolution: {
        name: "Resolution",
        min: 10,
        max: 100,
        step: 1,
        default: 30,
        description: "Grid resolution",
        isLocked: false,
      },
    },
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, scale, threshold } = params;
    const scaledX = (x || 0) * scale;
    const scaledY = (y || 0) * scale;
    const scaledZ = (z || 0) * scale;
    return (
      Math.sin(scaledX) * Math.cos(scaledY) +
      Math.sin(scaledY) * Math.cos(scaledZ) +
      Math.sin(scaledZ) * Math.cos(scaledX) -
      threshold
    );
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const resolution = params.resolution || 30; // Default resolution
    const size = 10; // Half the size of the volume
    const step = (2 * size) / resolution; // Step size between grid points

    const vertices: number[] = [];
    const normals: number[] = [];

    // Precompute grid values
    const grid = new Float32Array((resolution + 1) * (resolution + 1) * (resolution + 1));
    for (let x = 0; x <= resolution; x++) {
      for (let y = 0; y <= resolution; y++) {
        for (let z = 0; z <= resolution; z++) {
          const px = -size + x * step;
          const py = -size + y * step;
          const pz = -size + z * step;
          grid[x + y * (resolution + 1) + z * (resolution + 1) * (resolution + 1)] =
            this.calculate({ ...params, x: px, y: py, z: pz });
        }
      }
    }

    // Use Marching Cubes algorithm
    const marchingCubes = new MarchingCubes();
    marchingCubes.generateGeometry(grid, resolution, size, step, vertices, normals);




    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    return geometry;
  }
}