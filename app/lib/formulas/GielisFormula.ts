import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GielisFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gielis Formula",
    description: "Generates shapes based on superformula discovered by Johan Gielis",
    supportedDimensions: ['2d', '3d'],
    parameters: {
      a: {
        name: "A",
        description: "Parameter a for the formula",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1
      },
      b: {
        name: "B",
        description: "Parameter b for the formula",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1
      },
      m: {
        name: "M",
        description: "Number of symmetries",
        min: 1,
        max: 20,
        step: 1,
        default: 6
      },
      n1: {
        name: "N1",
        description: "First exponent",
        min: 0.1,
        max: 20,
        step: 0.1,
        default: 1
      },
      n2: {
        name: "N2",
        description: "Second exponent",
        min: 0.1,
        max: 20,
        step: 0.1,
        default: 1
      },
      n3: {
        name: "N3",
        description: "Third exponent",
        min: 0.1,
        max: 20,
        step: 0.1,
        default: 1
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { a, b, m, n1, n2, n3, phi } = params;
    const part1 = Math.abs(Math.cos(m * phi / 4) / a) ** n2;
    const part2 = Math.abs(Math.sin(m * phi / 4) / b) ** n3;
    return (part1 + part2) ** (-1 / n1);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const segments = 180;
    const rings = 180;
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
        
        params.phi = phi;
        const r = this.calculate(params);

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

  // Implement 2D methods
  calculateCartesian2D(x: number, params: FormulaParams): number {
    // For Gielis formula in 2D, we implement a polar to Cartesian transform
    // First calculate the radius at various angles
    const steps = 1000;
    const maxAngle = Math.PI * 2;
    
    // Find the smallest distance from the point to the curve
    let minDistance = Infinity;
    let yValue = 0;
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * maxAngle;
      params.phi = angle;
      const r = this.calculate(params);
      
      const curveX = r * Math.cos(angle);
      const curveY = r * Math.sin(angle);
      
      const distance = Math.sqrt((x - curveX) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        yValue = curveY;
      }
    }
    
    return yValue;
  }

  createPlotData(params: FormulaParams, resolution: number = 100): { x: number[], y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    
    // For the Gielis formula, we can directly plot in polar coordinates
    const maxAngle = Math.PI * 2;
    
    for (let i = 0; i <= resolution; i++) {
      const angle = (i / resolution) * maxAngle;
      params.phi = angle;
      const r = this.calculate(params);
      
      // Convert to Cartesian
      x.push(r * Math.cos(angle));
      y.push(r * Math.sin(angle));
    }
    
    return { x, y };
  }
}
