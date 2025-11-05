import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class RoseCurveFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Rose Curve",
    description: "Mathematical rose with customizable petals, can be extended to 3D",
    supportedDimensions: ['2d', '3d'],
    categories: ["Parametric", "2D", "3D", "Polar"],
    tags: ["rose", "polar", "petals", "flower", "curve"],
    parameters: {
      n: {
        name: "Petals (n)",
        description: "Number of petals (if n/d is odd) or 2n petals (if even)",
        min: 1,
        max: 12,
        step: 1,
        default: 5
      },
      d: {
        name: "Denominator (d)",
        description: "Denominator in n/d ratio",
        min: 1,
        max: 12,
        step: 1,
        default: 1
      },
      amplitude: {
        name: "Amplitude",
        description: "Size of the rose",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      depth: {
        name: "Depth (3D)",
        description: "Extrusion depth for 3D mode",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      twist: {
        name: "Twist (3D)",
        description: "Twist amount in 3D extrusion",
        min: 0,
        max: 4,
        step: 0.1,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { n, d, amplitude, phi } = params;
    const k = n / d;
    return amplitude * Math.abs(Math.cos(k * phi));
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { n, d, amplitude, depth, twist } = params;
    const angularSegments = 360;
    const depthSegments = 32;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    
    const k = n / d;

    // Create extruded rose curve
    for (let i = 0; i <= depthSegments; i++) {
      const z = (i / depthSegments - 0.5) * depth * 2;
      const twistAngle = (i / depthSegments) * twist * Math.PI * 2;
      
      for (let j = 0; j <= angularSegments; j++) {
        const angle = (j / angularSegments) * Math.PI * 2;
        const r = amplitude * Math.abs(Math.cos(k * angle));
        
        // Apply twist
        const rotatedAngle = angle + twistAngle;
        const x = r * Math.cos(rotatedAngle);
        const y = r * Math.sin(rotatedAngle);
        
        vertices.push(x, y, z);
        
        // Calculate normals (pointing outward from center)
        const normal = new THREE.Vector3(x, y, 0).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        // UV coordinates
        uvs.push(j / angularSegments, i / depthSegments);
        
        // Color based on petal and depth (color-coded parts)
        const petalIndex = Math.floor((angle / (Math.PI * 2)) * (n % 2 === 0 ? 2 * n : n));
        const hue = (petalIndex / (n % 2 === 0 ? 2 * n : n)) % 1;
        const saturation = 0.7 + Math.sin(angle * k) * 0.2;
        const lightness = 0.5 + (i / depthSegments) * 0.3;
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
      }
    }

    // Create indices
    for (let i = 0; i < depthSegments; i++) {
      for (let j = 0; j < angularSegments; j++) {
        const a = i * (angularSegments + 1) + j;
        const b = a + angularSegments + 1;
        const c = a + 1;
        const d = b + 1;
        
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // 2D plotting
  calculateCartesian2D(x: number, params: FormulaParams): number {
    // For rose curve in 2D, we convert polar to cartesian
    return 0; // Rose is better displayed in polar, handled by createPlotData
  }

  createPlotData(params: FormulaParams, resolution: number = 360): { x: number[], y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    const { n, d, amplitude } = params;
    const k = n / d;
    
    const maxAngle = Math.PI * 2;
    
    for (let i = 0; i <= resolution; i++) {
      const angle = (i / resolution) * maxAngle;
      const r = amplitude * Math.abs(Math.cos(k * angle));
      
      x.push(r * Math.cos(angle));
      y.push(r * Math.sin(angle));
    }
    
    return { x, y };
  }
}
