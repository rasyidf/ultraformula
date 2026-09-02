import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class CartesianSineFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Cartesian Sine",
    description: "A formula optimized for 2D Cartesian plotting with sine waves",
    supportedDimensions: ['2d', '3d'],
    categories: ["Wave", "Sine", "2D", "3D"],
    tags: ["cartesian", "sine", "wave", "plot", "math"],
    parameters: {
      amplitude: {
        name: "Amplitude",
        description: "Wave height",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1
      },
      frequency: {
        name: "Frequency",
        description: "Wave frequency",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 1
      },
      phase: {
        name: "Phase",
        description: "Phase shift",
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
        default: 0
      },
      vertical: {
        name: "Vertical Shift",
        description: "Vertical position adjustment",
        min: -5,
        max: 5,
        step: 0.1,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    // This is used for 3D visualization
    const { amplitude, frequency, phase, phi, theta = Math.PI / 2 } = params;
    const r = 1 + amplitude * Math.sin(frequency * phi + phase);
    return r;
  }

  // The 2D methods are the primary focus of this formula
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { amplitude, frequency, phase, vertical } = params;
    return amplitude * Math.sin(frequency * x + phase) + vertical;
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