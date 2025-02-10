import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import { BaseFormula } from "./BaseFormula";

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
        description: "Structure density",
        isLocked: false
      },
      threshold: {
        name: "Threshold",
        min: -3,
        max: 3,
        step: 0.1,
        description: "Surface boundary",
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, scale, threshold } = params;
    const [sx, sy, sz] = [(x || 0)*scale, (y || 0)*scale, (z || 0)*scale];
    return Math.sin(sx)*Math.cos(sy) + 
           Math.sin(sy)*Math.cos(sz) + 
           Math.sin(sz)*Math.cos(sx) - threshold;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    // Requires marching cubes implementation for proper surface extraction
    // This is a simplified visualization using a point cloud
    const size = 10;
    const step = 0.5;
    const vertices = [];
    
    for(let x = -size; x <= size; x += step) {
      for(let y = -size; y <= size; y += step) {
        for(let z = -size; z <= size; z += step) {
          const val = this.calculate({ ...params, x, y, z });
          if(Math.abs(val) < 0.5) { // Simple threshold check
            vertices.push(x, y, z);
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }
}