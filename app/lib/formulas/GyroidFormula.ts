import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GyroidFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gyroid",
    description: "Triply periodic minimal surface",
    supportedDimensions: ['3d'],
    categories: ["Surface", "Minimal Surface", "3D"],
    tags: ["gyroid", "periodic", "math", "geometry"],
    parameters: {
      scale: {
        name: "Scale",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 0.2,
        description: "Structure density",
        isLocked: false,
      },
      threshold: {
        name: "Threshold",
        min: -1.5,
        max: 1.5,
        step: 0.1,
        default: 0.0, // Changed from 2.0 to 0.0 for better results
        description: "Surface boundary",
        isLocked: false,
      },
      resolution: {
        name: "Resolution",
        min: 10,
        max: 100,
        step: 1,
        default: 30,
        description: "Grid resolution",
        isLocked: false,
      },
      smoothing: {
        name: "Smoothing",
        min: 0,
        max: 3,
        step: 1,
        default: 1,
        description: "Surface smoothness",
        isLocked: false,
      }
    },
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, scale, threshold } = params;
    const scaledX = (x || 0) * scale;
    const scaledY = (y || 0) * scale;
    const scaledZ = (z || 0) * scale;
    
    // The standard gyroid formula with proper threshold handling
    return (
      Math.sin(scaledX) * Math.cos(scaledY) +
      Math.sin(scaledY) * Math.cos(scaledZ) +
      Math.sin(scaledZ) * Math.cos(scaledX) -
      (threshold || 0)
    );
  }

  // Add mesh smoothing to reduce spikes
}