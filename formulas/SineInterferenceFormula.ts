import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import { BaseFormula } from "./BaseFormula";

export class SineInterferenceFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "3D Sine Waves",
    description: "Interference pattern from combined sine waves",
    parameters: {
      freqX: {
        name: "X Frequency",
        min: 1,
        max: 20,
        step: 0.5,
        description: "Frequency along X-axis",
        isLocked: false
      },
      freqY: {
        name: "Y Frequency",
        min: 1,
        max: 20,
        step: 0.5,
        description: "Frequency along Y-axis",
        isLocked: false
      },
      freqZ: {
        name: "Z Frequency",
        min: 1,
        max: 20,
        step: 0.5,
        description: "Frequency along Z-axis",
        isLocked: false
      },
      amplitude: {
        name: "Amplitude",
        min: 0.1,
        max: 2,
        step: 0.1,
        description: "Wave height",
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, freqX, freqY, freqZ, amplitude } = params;
    return amplitude * (
      Math.sin((x || 0) * freqX) + 
      Math.sin((y || 0) * freqY) + 
      Math.sin((z || 0) * freqZ)
    );
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const size = 15;
    const step = 0.8;
    const vertices = [];
    const indices = [];
    let vertexCount = 0;

    for(let x = -size; x <= size; x += step) {
      for(let z = -size; z <= size; z += step) {
        const y = this.calculate({ ...params, x, z });
        vertices.push(x, y, z);
        
        if(x < size && z < size) {
          indices.push(
            vertexCount, 
            vertexCount + 1, 
            vertexCount + Math.floor(size*2/step) + 2,
            vertexCount + 1,
            vertexCount + Math.floor(size*2/step) + 2,
            vertexCount + Math.floor(size*2/step) + 3
          );
        }
        vertexCount++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}