import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class MobiusFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Mobius Strip",
    description: "Creates a Mobius strip with parametric adjustments",
    supportedDimensions: ['2d', '3d'],
    categories: ["Surface", "Parametric", "2D", "3D"],
    tags: ["mobius", "strip", "parametric", "geometry", "topology"],
    supportsVertexColors: true,
    colorScheme: 'gradient',
    parameters: {
      radius: {
        name: "Radius",
        description: "Radius of the Mobius strip",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2
      },
      width: {
        name: "Width",
        description: "Width of the Mobius strip",
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 1
      },
      twist: {
        name: "Twist",
        description: "Number of half-twists",
        min: 1,
        max: 10,
        step: 1,
        default: 7
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { radius, width } = params;
    // This is not really a radius calculation, but we return a value
    // to satisfy the interface requirements
    return radius * width;
  }

  // 2D methods for Mobius strip visualization
  calculateCartesian2D(x: number, params: FormulaParams): number {
    const { radius, width, twist } = params;
    
    // For 2D visualization, we'll create a flattened view of the Mobius strip
    // by showing a sinusoidal wave that wraps back on itself
    const angle = (x + 5) * Math.PI / 5; // Map x from -5 to 5 to angle from 0 to 2π
    
    // Calculate the height of the strip at this angle
    const y = width * Math.sin(twist * angle / 2);
    
    return y;
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