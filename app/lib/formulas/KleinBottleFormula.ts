import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class KleinBottleFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Klein Bottle",
    description: "Non-orientable surface with no distinction between inside and outside",
    supportedDimensions: ['3d'],
    categories: ["Parametric", "3D", "Topology"],
    tags: ["klein", "bottle", "topology", "non-orientable", "manifold"],
    parameters: {
      scale: {
        name: "Scale",
        description: "Overall size of the bottle",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      complexity: {
        name: "Complexity",
        description: "Complexity factor for the shape",
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1
      },
      twist: {
        name: "Twist",
        description: "Additional twist factor",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1
      },
      thickness: {
        name: "Thickness",
        description: "Thickness of the bottle surface",
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1
      }
    }
  };

  calculate(params: FormulaParams): number {
    return params.scale || 1.5;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { scale, complexity, twist, thickness } = params;
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
        
        // Klein bottle parametric equations (figure-8 immersion)
        const r = 4 * (1 - Math.cos(u) / 2);
        let x, y, z;
        
        if (u < Math.PI) {
          x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.cos(u * twist);
          y = 16 * Math.sin(u);
          z = r * Math.sin(v + Math.PI);
        } else {
          x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.cos(u * twist);
          y = 16 * Math.sin(u);
          z = r * Math.sin(v);
        }
        
        // Apply parameters
        x *= scale * 0.1 * complexity;
        y *= scale * 0.1 * complexity;
        z *= scale * 0.1 * thickness;
        
        vertices.push(x, y, z);
        
        // Calculate normals (approximate)
        const epsilon = 0.001;
        let x1, y1, z1;
        const u1 = u + epsilon;
        const r1 = 4 * (1 - Math.cos(u1) / 2);
        
        if (u1 < Math.PI) {
          x1 = 6 * Math.cos(u1) * (1 + Math.sin(u1)) + r1 * Math.cos(v + Math.PI) * Math.cos(u1 * twist);
          y1 = 16 * Math.sin(u1);
          z1 = r1 * Math.sin(v + Math.PI);
        } else {
          x1 = 6 * Math.cos(u1) * (1 + Math.sin(u1)) + r1 * Math.cos(v) * Math.cos(u1 * twist);
          y1 = 16 * Math.sin(u1);
          z1 = r1 * Math.sin(v);
        }
        
        x1 *= scale * 0.1 * complexity;
        y1 *= scale * 0.1 * complexity;
        z1 *= scale * 0.1 * thickness;
        
        const tangentU = new THREE.Vector3(x1 - x, y1 - y, z1 - z);
        
        let x2, y2, z2;
        const v1 = v + epsilon;
        if (u < Math.PI) {
          x2 = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v1 + Math.PI) * Math.cos(u * twist);
          y2 = 16 * Math.sin(u);
          z2 = r * Math.sin(v1 + Math.PI);
        } else {
          x2 = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v1) * Math.cos(u * twist);
          y2 = 16 * Math.sin(u);
          z2 = r * Math.sin(v1);
        }
        
        x2 *= scale * 0.1 * complexity;
        y2 *= scale * 0.1 * complexity;
        z2 *= scale * 0.1 * thickness;
        
        const tangentV = new THREE.Vector3(x2 - x, y2 - y, z2 - z);
        const normal = tangentU.cross(tangentV).normalize();
        
        normals.push(normal.x, normal.y, normal.z);
        
        // UV coordinates
        uvs.push(i / segments, j / tubes);
        
        // Color based on u and v parameters (color-coded parts)
        // Create a gradient based on position along the bottle
        const hue = u / (Math.PI * 2);
        const saturation = 0.8;
        const lightness = 0.4 + Math.abs(Math.sin(v)) * 0.3;
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
