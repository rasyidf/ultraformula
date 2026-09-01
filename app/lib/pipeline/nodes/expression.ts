import { FormulaParser } from "~/lib/FormulaParser";
import type { Field, NodeDefinition } from "../types";
import { num } from "./_shared";

const DEFAULT_EXPR = "= sin(x * 0.3) * cos(z * 0.3) * 4";

/** A generator whose field comes from evaluating a user expression string. */
export const expressionNode: NodeDefinition = {
  type: "expression",
  label: "Expression",
  category: "Generator",
  group: "Custom",
  description: "Field defined by a math expression of x, y, z (must start with =)",
  tags: ["expression", "formula", "custom", "math"],
  inputs: [],
  outputs: [{ id: "field", label: "Field", type: "field" }],
  params: {
    amplitude: num("amplitude", { min: 0, max: 20, step: 0.1, default: 1 }),
  },
  configFields: [
    {
      key: "expr",
      label: "Expression",
      description: "e.g. = sin(x*0.3) * cos(z*0.3) * 4",
      default: DEFAULT_EXPR,
      multiline: true,
    },
  ],
  evaluate: ({ params, config }) => {
    const expr = (config.expr ?? DEFAULT_EXPR).trim() || DEFAULT_EXPR;
    const amplitude = params.amplitude ?? 1;
    const valid = FormulaParser.validateFormula(expr);
    const field: Field = {
      sample: (x, y, z) => {
        if (!valid) return 0;
        try {
          return FormulaParser.evaluate(expr, { x, y, z }) * amplitude;
        } catch {
          return 0;
        }
      },
      dimensionHint: "3d",
    };
    if (!valid) throw new Error(`Invalid expression: "${expr}"`);
    return { field: { type: "field", value: field } };
  },
};
