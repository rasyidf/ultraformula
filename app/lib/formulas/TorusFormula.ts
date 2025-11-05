import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class TorusFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Torus",
    description: "Classic torus (donut) shape with customizable radii",
    supportedDimensions: ['3d'],
    categories: ["Parametric", "3D", "Classic"],
    tags: ["torus", "donut", "parametric", "topology"],
    parameters: {
      majorRadius: {
        name: "Major Radius",
        description: "Distance from center to tube center",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2
      },
      minorRadius: {
        name: "Minor Radius",
        description: "Radius of the tube",
        min: 0.1,
        max: 2,
        step: 0.05,
        default: 0.8
      },
      twists: {
        name: "Twists",
        description: "Number of twists around the torus",
        min: 0,
        max: 10,
        step: 1,
        default: 0
      },
      waviness: {
        name: "Waviness",
        description: "Wave amplitude on the surface",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { majorRadius, minorRadius } = params;
    return majorRadius + minorRadius;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { majorRadius, minorRadius, twists, waviness } = params;
    const segments = 128;
    const tubes = 64;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * Math.PI * 2;
      
      for (let j = 0; j <= tubes; j++) {
        const v = (j / tubes) * Math.PI * 2;
        
        // Add twist effect
        const twistAngle = (i / segments) * twists * Math.PI * 2;
        const vTwisted = v + twistAngle;
        
        // Add waviness
        const waveOffset = Math.sin(u * 4) * Math.cos(v * 3) * waviness;
        const effectiveMinorRadius = minorRadius + waveOffset;
        
        // Torus parametric equations
        const x = (majorRadius + effectiveMinorRadius * Math.cos(vTwisted)) * Math.cos(u);
        const y = (majorRadius + effectiveMinorRadius * Math.cos(vTwisted)) * Math.sin(u);
        const z = effectiveMinorRadius * Math.sin(vTwisted);
        
        vertices.push(x, y, z);
        
        // Calculate normals
        const centerX = majorRadius * Math.cos(u);
        const centerY = majorRadius * Math.sin(u);
        const normal = new THREE.Vector3(x - centerX, y - centerY, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        // UV coordinates
        uvs.push(i / segments, j / tubes);
        
        // Color based on position (color-coded parts)
        // Color by angle around major radius
        const hue = u / (Math.PI * 2);
        const saturation = 0.7;
        const lightness = 0.5 + Math.sin(v) * 0.2;
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
      }
    }

    // Create indices
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < tubes; j++) {
        const a = i * (tubes + 1) + j;
        const b = a + tubes + 1;
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
}
