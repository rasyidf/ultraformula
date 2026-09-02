import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class SineInterferenceFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Sine Interference",
    description: "Creates interference patterns using sine waves",
    supportedDimensions: ['2d', '3d'],
    categories: ["Wave", "Interference", "2D", "3D"],
    tags: ["sine", "interference", "wave", "pattern", "math"],
    parameters: {
      frequency1: {
        name: "Frequency 1",
        description: "Frequency of first wave",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 2
      },
      frequency2: {
        name: "Frequency 2",
        description: "Frequency of second wave",
        min: 0.1,
        max: 10,
        step: 0.1,
        default: 3
      },
      amplitude1: {
        name: "Amplitude 1",
        description: "Amplitude of first wave",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      amplitude2: {
        name: "Amplitude 2",
        description: "Amplitude of second wave",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      phase: {
        name: "Phase",
        description: "Phase difference",
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { frequency1, frequency2, amplitude1, amplitude2, phase, phi, theta = Math.PI / 2 } = params;
    
    const wave1 = amplitude1 * Math.sin(frequency1 * phi);
    const wave2 = amplitude2 * Math.sin(frequency2 * phi + phase);
    
    return 1 + wave1 * Math.sin(theta) + wave2 * Math.cos(theta);
  }

  // Implement 2D methods for sine interference
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { frequency1, frequency2, amplitude1, amplitude2, phase } = params;
    
    // For 2D visualization, we'll use a sine wave combination
    const wave1 = amplitude1 * Math.sin(frequency1 * x);
    const wave2 = amplitude2 * Math.sin(frequency2 * x + phase);
    
    return wave1 + wave2;
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