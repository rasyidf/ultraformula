import * as THREE from "three";
import type { Formula, FormulaMetadata, FormulaParams } from "~/types/Formula";

export abstract class BaseFormula implements Formula {
  abstract metadata: FormulaMetadata;
  abstract calculate(params: FormulaParams): number;

  // 3D formulas override this. Non-mesh formulas (e.g. tile-grid / WFC) inherit
  // the empty default and are never offered the 3D mesh view.
  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    return new THREE.BufferGeometry();
  }

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

  // Default color calculation method
  calculateColor(position: THREE.Vector3, params: FormulaParams, uv?: { u: number; v: number }): THREE.Color {
    // Default: rainbow gradient based on horizontal angle
    if (uv) {
      const hue = uv.u;
      const saturation = 0.7;
      const lightness = 0.5 + Math.sin(uv.v * Math.PI) * 0.2;
      return new THREE.Color().setHSL(hue, saturation, lightness);
    }
    
    // Fallback: color based on position angle
    const angle = Math.atan2(position.z, position.x);
    const hue = (angle + Math.PI) / (Math.PI * 2);
    return new THREE.Color().setHSL(hue, 0.7, 0.5);
  }
}
