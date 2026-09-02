import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class KleinBottleFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Klein Bottle",
    description: "Non-orientable surface with no distinction between inside and outside",
    supportedDimensions: ['3d'],
    categories: ["Parametric", "3D", "Topology"],
    tags: ["klein", "bottle", "topology", "non-orientable", "manifold"],
    parameters: {
      scale: {
        name: "Scale",
        description: "Overall size of the bottle",
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      complexity: {
        name: "Complexity",
        description: "Complexity factor for the shape",
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1
      },
      twist: {
        name: "Twist",
        description: "Additional twist factor",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1
      },
      thickness: {
        name: "Thickness",
        description: "Thickness of the bottle surface",
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1
      }
    }
  };

  calculate(params: FormulaParams): number {
    return params.scale || 1.5;
  }

}
