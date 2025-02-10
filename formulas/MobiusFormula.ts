import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import { BaseFormula } from "./BaseFormula";

export class MobiusFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Möbius Strip",
    description: "One-sided minimal surface with half-twist",
    parameters: {
      radius: {
        name: "Radius",
        min: 0.5,
        max: 10,
        step: 0.1,
        description: "Main ring radius",
        isLocked: false
      },
      width: {
        name: "Width",
        min: 0.1,
        max: 2,
        step: 0.1,
        description: "Strip width",
        isLocked: false
      },
      subdivisions: {
        name: "Subdivisions",
        min: 3,
        max: 128,
        step: 1,
        description: "Radial divisions",
        isLocked: false
      },
      twist: {
        name: "Twist",
        min: 0.5,
        max: 3,
        step: 0.5,
        description: "Number of half-twists",
        isLocked: false
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculate(_params: FormulaParams): number {
    // Not used for parametric surface, but required by interface
    return 0;
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const { radius = 2, width = 0.5, subdivisions = 64, twist = 1 } = params;
    const vertices = [];
    const indices = [];
    const widthSegments = Math.max(2, Math.floor(subdivisions / 16));

    // Parametric surface generation
    for (let u = 0; u <= subdivisions; u++) {
      const t = (u / subdivisions) * Math.PI * 2;
      for (let v = 0; v <= widthSegments; v++) {
        const w = (v / widthSegments - 0.5) * width;
        
        // Möbius strip parametric equations
        const x = (radius + w * Math.cos(twist * t / 2)) * Math.cos(t);
        const y = (radius + w * Math.cos(twist * t / 2)) * Math.sin(t);
        const z = w * Math.sin(twist * t / 2);

        vertices.push(x, y, z);
      }
    }

    // Generate indices for triangle mesh
    for (let u = 0; u < subdivisions; u++) {
      for (let v = 0; v < widthSegments; v++) {
        const a = u * (widthSegments + 1) + v;
        const b = (u + 1) * (widthSegments + 1) + v;
        const c = (u + 1) * (widthSegments + 1) + v + 1;
        const d = u * (widthSegments + 1) + v + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }
}