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
