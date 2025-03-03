import * as THREE from "three";
import type { Formula, FormulaMetadata, FormulaParams } from "~/types/Formula";

export abstract class BaseFormula implements Formula {
  abstract metadata: FormulaMetadata;
  abstract calculate(params: FormulaParams): number;
  abstract createGeometry(params: FormulaParams): THREE.BufferGeometry;

  // Default 2D methods that can be overridden by subclasses
  calculate2D(x: number, y: number, params: FormulaParams): number {
    return this.calculate({ ...params, x, y });
  }

  calculateCartesian2D(x: number, params: FormulaParams): number {
    // Default implementation for cartesian plot
    return 0;
  }

  createPlotData(params: FormulaParams, resolution: number = 100): { x: number[], y: number[] } {
    // Generate x and y coordinates for plotting
    const x: number[] = [];
    const y: number[] = [];
    
    // Default range from -5 to 5, adjust as needed
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
