import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class TorusFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Torus",
    description: "Classic torus (donut) shape with customizable radii",
    supportedDimensions: ['3d'],
    categories: ["Parametric", "3D", "Classic"],
    tags: ["torus", "donut", "parametric", "topology"],
    parameters: {
      majorRadius: {
        name: "Major Radius",
        description: "Distance from center to tube center",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2
      },
      minorRadius: {
        name: "Minor Radius",
        description: "Radius of the tube",
        min: 0.1,
        max: 2,
        step: 0.05,
        default: 0.8
      },
      twists: {
        name: "Twists",
        description: "Number of twists around the torus",
        min: 0,
        max: 10,
        step: 1,
        default: 0
      },
      waviness: {
        name: "Waviness",
        description: "Wave amplitude on the surface",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { majorRadius, minorRadius } = params;
    return majorRadius + minorRadius;
  }

}
