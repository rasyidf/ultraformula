import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class CartesianSineFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Cartesian Sine",
    description: "A formula optimized for 2D Cartesian plotting with sine waves",
    supportedDimensions: ['2d', '3d'],
    parameters: {
      amplitude: {
        name: "Amplitude",
        description: "Wave height",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1
      },
      frequency: {
        name: "Frequency",
        description: "Wave frequency",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 1
      },
      phase: {
        name: "Phase",
        description: "Phase shift",
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
        default: 0
      },
      vertical: {
        name: "Vertical Shift",
        description: "Vertical position adjustment",
        min: -5,
        max: 5,
        step: 0.1,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    // This is used for 3D visualization
    const { amplitude, frequency, phase, phi, theta = Math.PI / 2 } = params;
    const r = 1 + amplitude * Math.sin(frequency * phi + phase);
    return r;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    // For 3D visualization, we'll create a sine wave wrapped around a cylinder
    const { amplitude, frequency, phase } = params;
    const segments = 128;
    const rings = 64;
    const tubeRadius = 0.1;
    const maxPhi = Math.PI * 2;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Create a tube following a sine wave path
    for (let ring = 0; ring <= rings; ring++) {
      const theta = (ring / rings) * maxPhi;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let segment = 0; segment <= segments; segment++) {
        const phi = (segment / segments) * maxPhi;
        
        // Calculate the sine wave position
        const x = Math.cos(phi);
        const z = Math.sin(phi);
        const y = amplitude * Math.sin(frequency * phi + phase);
        
        // Create a circle around this point
        const nx = tubeRadius * cosTheta * x - tubeRadius * sinTheta * z;
        const nz = tubeRadius * sinTheta * x + tubeRadius * cosTheta * z;
        
        // Add vertex
        vertices.push(nx, y + tubeRadius * cosTheta, nz);
        
        // Normals
        const normal = new THREE.Vector3(nx - x, tubeRadius * cosTheta, nz - z).normalize();
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

  // The 2D methods are the primary focus of this formula
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { amplitude, frequency, phase, vertical } = params;
    return amplitude * Math.sin(frequency * x + phase) + vertical;
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