import * as THREE from "three";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";
import { FormulaParser } from "./FormulaParser";
import { BaseFormula } from "./formulas/BaseFormula";

export class DynamicFormula extends BaseFormula {
  metadata: FormulaMetadata;
  private formulaString: string;
  private formula2DString?: string;

  constructor(
    metadata: FormulaMetadata,
    formulaString: string,
    formula2DString?: string
  ) {
    super();
    this.metadata = metadata;
    this.formulaString = formulaString;
    this.formula2DString = formula2DString;
  }

  validate(): boolean {
    const mainValid = FormulaParser.validateFormula(this.formulaString);
    
    if (this.formula2DString) {
      return mainValid && FormulaParser.validateFormula(this.formula2DString);
    }
    
    return mainValid;
  }

  calculate(params: FormulaParams): number {
    return FormulaParser.evaluate(this.formulaString, params);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    // Default implementation creates a sphere with the formula determining the radius
    const segments = 64;
    const rings = 64;
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
        
        // Use our formula to determine the radius at this angle
        const r = this.calculate({ ...params, phi, theta });

        // Convert to Cartesian coordinates
        const x = r * sinTheta * Math.cos(phi);
        const y = r * cosTheta;
        const z = r * sinTheta * Math.sin(phi);

        // Add vertex
        vertices.push(x, y, z);
        
        // Simple normals pointing outward
        const normal = new THREE.Vector3(x, y, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        // UV coordinates
        const u = segment / segments;
        const v = ring / rings;
        uvs.push(u, v);
      }
    }

    // Create indices for triangles
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

  // 2D methods
  calculateCartesian2D(x: number, params: FormulaParams): number {
    if (this.formula2DString) {
      // Use custom 2D formula if available
      return FormulaParser.evaluate(this.formula2DString, { ...params, x });
    }
    
    // If no custom 2D formula is provided, create a default one
    // that plots a simple representation of the 3D formula 
    // by using the x value as phi and fixing theta to PI/2 (equator)
    return this.calculate({ ...params, phi: x, theta: Math.PI / 2 });
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