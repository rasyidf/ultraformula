import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class SineInterferenceFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Sine Interference",
    description: "Creates interference patterns using sine waves",
    supportedDimensions: ['2d', '3d'],
    categories: ["Wave", "Interference", "2D", "3D"],
    tags: ["sine", "interference", "wave", "pattern", "math"],
    parameters: {
      frequency1: {
        name: "Frequency 1",
        description: "Frequency of first wave",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 2
      },
      frequency2: {
        name: "Frequency 2",
        description: "Frequency of second wave",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 3
      },
      amplitude1: {
        name: "Amplitude 1",
        description: "Amplitude of first wave",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      amplitude2: {
        name: "Amplitude 2",
        description: "Amplitude of second wave",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      phase: {
        name: "Phase",
        description: "Phase difference",
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { frequency1, frequency2, amplitude1, amplitude2, phase, phi, theta = Math.PI / 2 } = params;
    
    const wave1 = amplitude1 * Math.sin(frequency1 * phi);
    const wave2 = amplitude2 * Math.sin(frequency2 * phi + phase);
    
    return 1 + wave1 * Math.sin(theta) + wave2 * Math.cos(theta);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const segments = 128;
    const rings = 128;
    const maxPhi = Math.PI * 2;
    const maxTheta = Math.PI;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (let ring = 0; ring <= rings; ring++) {
      const theta = (ring / rings) * maxTheta;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let segment = 0; segment <= segments; segment++) {
        const phi = (segment / segments) * maxPhi;
        
        const r = this.calculate({ ...params, phi, theta });

        // Convert to Cartesian coordinates
        const x = r * sinTheta * Math.cos(phi);
        const y = r * cosTheta;
        const z = r * sinTheta * Math.sin(phi);

        // Add vertex
        vertices.push(x, y, z);
        
        // Normals (simplified)
        const normal = new THREE.Vector3(x, y, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        // UV coordinates
        const u = segment / segments;
        const v = ring / rings;
        uvs.push(u, v);
      }
    }

    // Create indices
    for (let ring = 0; ring < rings; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const first = (ring * (segments + 1)) + segment;
        const second = first + segments + 1;
        
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Implement 2D methods for sine interference
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { frequency1, frequency2, amplitude1, amplitude2, phase } = params;
    
    // For 2D visualization, we'll use a sine wave combination
    const wave1 = amplitude1 * Math.sin(frequency1 * x);
    const wave2 = amplitude2 * Math.sin(frequency2 * x + phase);
    
    return wave1 + wave2;
  }

  createPlotData(params: FormulaParams, resolution: number = 200): { x: number[], y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    
    // Generate x values from -5 to 5
    const range = 10;
    const step = range / resolution;
    
    for (let i = 0; i <= resolution; i++) {
      const xVal = -range/2 + i * step;
      x.push(xVal);
      y.push(this.calculateCartesian2D(xVal, params));
    }
    
    return { x, y };
  }
}