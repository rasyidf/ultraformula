import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class MobiusFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Mobius Strip",
    description: "Creates a Mobius strip with parametric adjustments",
    supportedDimensions: ['2d', '3d'],
    parameters: {
      radius: {
        name: "Radius",
        description: "Radius of the Mobius strip",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2
      },
      width: {
        name: "Width",
        description: "Width of the Mobius strip",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 1
      },
      twist: {
        name: "Twist",
        description: "Number of half-twists",
        min: 1,
        max: 10,
        step: 1,
        default: 1
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { radius, width } = params;
    // This is not really a radius calculation, but we return a value
    // to satisfy the interface requirements
    return radius * width;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { radius, width, twist } = params;
    const segments = 100;
    const sides = 20;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Create vertices
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const angle = u * Math.PI * 2;
      
      for (let j = 0; j <= sides; j++) {
        const v = j / sides;
        const w = v - 0.5; // Range from -0.5 to 0.5
        
        // Calculate the position on the Mobius strip
        const x = (radius + w * width * Math.cos(twist * angle / 2)) * Math.cos(angle);
        const y = (radius + w * width * Math.cos(twist * angle / 2)) * Math.sin(angle);
        const z = w * width * Math.sin(twist * angle / 2);
        
        vertices.push(x, z, y); // Swap y and z to lay the strip horizontally
        
        // Calculate normal vector (simplified)
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        const nz = 0;
        
        normals.push(nx, nz, ny);
        
        // UV coordinates
        uvs.push(u, v);
      }
    }
    
    // Create indices
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j;
        const b = a + 1;
        const c = a + (sides + 1);
        const d = c + 1;
        
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // 2D methods for Mobius strip visualization
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { radius, width, twist } = params;
    
    // For 2D visualization, we'll create a flattened view of the Mobius strip
    // by showing a sinusoidal wave that wraps back on itself
    const angle = (x + 5) * Math.PI / 5; // Map x from -5 to 5 to angle from 0 to 2π
    
    // Calculate the height of the strip at this angle
    const y = width * Math.sin(twist * angle / 2);
    
    return y;
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