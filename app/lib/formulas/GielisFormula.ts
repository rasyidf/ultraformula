import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GielisFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gielis Formula",
    description: "Generates shapes based on superformula discovered by Johan Gielis",
    supportedDimensions: ['2d', '3d'],
    categories: ["Superformula", "Parametric", "2D", "3D"],
    tags: ["gielis", "superformula", "parametric", "shape", "geometry"],
    supportsVertexColors: true,
    colorScheme: 'parametric',
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
