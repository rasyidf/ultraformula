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
