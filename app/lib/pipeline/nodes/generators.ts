import type { Field, NodeDefinition, PortValue } from "../types";
import { num, toggle } from "./_shared";

/** Uniform value everywhere — handy as a sea level or a blend operand. */
export const constantNode: NodeDefinition = {
  type: "constant",
  label: "Constant",
  category: "Generator",
  description: "A flat field of a single value",
  tags: ["constant", "value", "flat"],
  inputs: [],
  outputs: [{ id: "field", label: "Field", type: "field" }],
  params: {
    value: num("value", { min: -10, max: 10, step: 0.05, default: 0 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => {
    const v = params.value ?? 0;
    const field: Field = { sample: () => v, dimensionHint: "3d" };
    return { field: { type: "field", value: field } };
  },
};

/** Radial falloff from a centre point — island / vignette masks. */
export const radialGradientNode: NodeDefinition = {
  type: "radialGradient",
  label: "Radial Gradient",
  category: "Generator",
  description: "Circular falloff (1 at the centre, 0 past the radius)",
  tags: ["gradient", "radial", "mask", "island", "falloff"],
  inputs: [],
  outputs: [{ id: "field", label: "Field", type: "field" }],
  params: {
    radius: num("radius", { min: 1, max: 40, step: 0.5, default: 20 }),
    falloff: num("falloff", { min: 0.1, max: 6, step: 0.1, default: 2 }),
    centerX: num("center X", { min: -25, max: 25, step: 0.5, default: 0 }),
    centerZ: num("center Z", { min: -25, max: 25, step: 0.5, default: 0 }),
    invert: toggle("invert", 0),
  },
  evaluate: ({ params }): Record<string, PortValue> => {
    const radius = params.radius || 20;
    const falloff = params.falloff ?? 2;
    const cx = params.centerX ?? 0;
    const cz = params.centerZ ?? 0;
    const invert = !!Math.round(params.invert ?? 0);
    const field: Field = {
      sample: (x, _y, z) => {
        const d = Math.hypot(x - cx, z - cz) / radius;
        let v = Math.max(0, 1 - d);
        v = Math.pow(v, falloff);
        return invert ? 1 - v : v;
      },
      dimensionHint: "3d",
    };
    return { field: { type: "field", value: field } };
  },
};

/** Linear ramp along a direction. */
export const linearGradientNode: NodeDefinition = {
  type: "linearGradient",
  label: "Linear Gradient",
  category: "Generator",
  description: "A directional ramp across the plane",
  tags: ["gradient", "ramp", "linear", "slope"],
  inputs: [],
  outputs: [{ id: "field", label: "Field", type: "field" }],
  params: {
    angle: num("angle (deg)", { min: 0, max: 360, step: 1, default: 0 }),
    scale: num("scale", { min: 1, max: 60, step: 1, default: 30 }),
    offset: num("offset", { min: -5, max: 5, step: 0.05, default: 0 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => {
    const rad = ((params.angle ?? 0) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dz = Math.sin(rad);
    const scale = params.scale || 30;
    const offset = params.offset ?? 0;
    const field: Field = {
      sample: (x, _y, z) => (x * dx + z * dz) / scale + offset,
      dimensionHint: "3d",
    };
    return { field: { type: "field", value: field } };
  },
};

/** Checkerboard — test pattern / stylised tiling. */
export const checkerNode: NodeDefinition = {
  type: "checker",
  label: "Checker",
  category: "Generator",
  description: "Alternating ±1 squares",
  tags: ["checker", "pattern", "grid", "test"],
  inputs: [],
  outputs: [{ id: "field", label: "Field", type: "field" }],
  params: {
    cellSize: num("cell size", { min: 0.5, max: 20, step: 0.5, default: 4 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => {
    const cs = params.cellSize || 4;
    const field: Field = {
      sample: (x, _y, z) =>
        (Math.floor(x / cs) + Math.floor(z / cs)) % 2 === 0 ? 1 : -1,
      dimensionHint: "3d",
    };
    return { field: { type: "field", value: field } };
  },
};
