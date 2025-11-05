import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class LissajousFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Lissajous Curve",
    description: "Complex harmonic motion patterns, 3D version creates Lissajous knots",
    supportedDimensions: ['2d', '3d'],
    categories: ["Parametric", "2D", "3D", "Harmonic"],
    tags: ["lissajous", "harmonic", "oscillation", "knot", "curve"],
    parameters: {
      A: {
        name: "Amplitude X",
        description: "Amplitude of X oscillation",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1
      },
      B: {
        name: "Amplitude Y",
        description: "Amplitude of Y oscillation",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1
      },
      C: {
        name: "Amplitude Z",
        description: "Amplitude of Z oscillation (3D only)",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1
      },
      a: {
        name: "Frequency X",
        description: "Frequency of X oscillation",
        min: 1,
        max: 10,
        step: 1,
        default: 3
      },
      b: {
        name: "Frequency Y",
        description: "Frequency of Y oscillation",
        min: 1,
        max: 10,
        step: 1,
        default: 2
      },
      c: {
        name: "Frequency Z",
        description: "Frequency of Z oscillation (3D only)",
        min: 1,
        max: 10,
        step: 1,
        default: 4
      },
      delta: {
        name: "Phase Shift",
        description: "Phase difference between oscillations",
        min: 0,
        max: 6.28,
        step: 0.1,
        default: 1.57
      },
      tubeRadius: {
        name: "Tube Radius",
        description: "Thickness of the curve in 3D",
        min: 0.02,
        max: 0.3,
        step: 0.01,
        default: 0.08
      }
    }
  };

  calculate(params: FormulaParams): number {
    return params.A || 1;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { A, B, C, a, b, c, delta, tubeRadius } = params;
    const segments = 512; // Path resolution
    const tubularSegments = 24; // Tube cross-section resolution
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    // Generate Lissajous path points
    const pathPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = A * Math.sin(a * t + delta);
      const y = B * Math.sin(b * t);
      const z = C * Math.sin(c * t);
      pathPoints.push(new THREE.Vector3(x, y, z));
    }

    // Create tube geometry along the path
    for (let i = 0; i < pathPoints.length; i++) {
      const point = pathPoints[i];
      const nextPoint = pathPoints[(i + 1) % pathPoints.length];
      
      // Calculate tangent (direction of the curve)
      const tangent = new THREE.Vector3().subVectors(nextPoint, point).normalize();
      
      // Calculate normal and binormal for tube cross-section
      const arbitrary = Math.abs(tangent.y) < 0.99 
        ? new THREE.Vector3(0, 1, 0) 
        : new THREE.Vector3(1, 0, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, arbitrary).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      
      // Create tube cross-section
      for (let j = 0; j <= tubularSegments; j++) {
        const angle = (j / tubularSegments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Calculate vertex position
        const x = point.x + tubeRadius * (cos * normal.x + sin * binormal.x);
        const y = point.y + tubeRadius * (cos * normal.y + sin * binormal.y);
        const z = point.z + tubeRadius * (cos * normal.z + sin * binormal.z);
        
        vertices.push(x, y, z);
        
        // Normal for the tube surface
        const surfaceNormal = new THREE.Vector3(
          cos * normal.x + sin * binormal.x,
          cos * normal.y + sin * binormal.y,
          cos * normal.z + sin * binormal.z
        ).normalize();
        normals.push(surfaceNormal.x, surfaceNormal.y, surfaceNormal.z);
        
        // UV coordinates
        uvs.push(i / segments, j / tubularSegments);
        
        // Color based on position along the curve (color-coded parts)
        const t = i / segments;
        const hue = t;
        const saturation = 0.8;
        const lightness = 0.4 + Math.sin(angle) * 0.2;
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
      }
    }

    // Create indices
    for (let i = 0; i < pathPoints.length - 1; i++) {
      for (let j = 0; j < tubularSegments; j++) {
        const a = i * (tubularSegments + 1) + j;
        const b = a + tubularSegments + 1;
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
    // For Lissajous, X and Y are both functions of t
    // This method doesn't make sense for Lissajous curves
    return 0;
  }

  createPlotData(params: FormulaParams, resolution: number = 500): { x: number[], y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    const { A, B, a, b, delta } = params;
    
    const maxT = Math.PI * 2;
    
    for (let i = 0; i <= resolution; i++) {
      const t = (i / resolution) * maxT;
      x.push(A * Math.sin(a * t + delta));
      y.push(B * Math.sin(b * t));
    }
    
    return { x, y };
  }
}
