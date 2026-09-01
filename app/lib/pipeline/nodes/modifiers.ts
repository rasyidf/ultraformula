import { blendModeFromIndex, blendValues, BLEND_MODES } from "../ops/blend";
import { domainWarp } from "../ops/domainWarp";
import type { Field, NodeDefinition, PortValue } from "../types";
import { expectField, num, select, toggle } from "./_shared";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const domainWarpNode: NodeDefinition = {
  type: "domainWarp",
  label: "Domain Warp",
  category: "Modifier",
  description: "Displace sample coordinates by a Perlin warp field before reading",
  tags: ["warp", "distort", "erosion"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    warpStrength: num("warp strength", { min: 0, max: 4, step: 0.05, default: 1.2 }),
    warpScale: num("warp scale", { min: 0.1, max: 4, step: 0.1, default: 0.5 }),
    warpOctaves: num("warp octaves", { min: 1, max: 8, step: 1, default: 4 }),
    seed: num("seed", { min: 0, max: 1000, step: 1, default: 42 }),
  },
  evaluate: ({ inputs, params }) => {
    const input = expectField(inputs.in, "Domain Warp");
    const sample = domainWarp(input.sample, params);
    const field: Field = { sample, dimensionHint: input.dimensionHint };
    return { out: { type: "field", value: field } };
  },
};

export const blendNode: NodeDefinition = {
  type: "blend",
  label: "Blend",
  category: "Modifier",
  description: "Combine two fields (add / multiply / min / max / mix)",
  tags: ["combine", "mix", "math"],
  inputs: [
    { id: "a", label: "A", type: "field" },
    { id: "b", label: "B", type: "field" },
  ],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    mode: select("mode", [0, 1, 2, 3, 4], [...BLEND_MODES], 0),
    mix: num("mix amount", { min: 0, max: 1, step: 0.01, default: 0.5 }),
  },
  evaluate: ({ inputs, params }) => {
    const a = expectField(inputs.a, "Blend A");
    const b = expectField(inputs.b, "Blend B");
    const mode = blendModeFromIndex(params.mode ?? 0);
    const mix = params.mix ?? 0.5;
    const field: Field = {
      sample: (x, y, z) => blendValues(a.sample(x, y, z), b.sample(x, y, z), mode, mix),
      dimensionHint: a.dimensionHint === "3d" || b.dimensionHint === "3d" ? "3d" : "2d",
    };
    return { out: { type: "field", value: field } };
  },
};

export const transformNode: NodeDefinition = {
  type: "transform",
  label: "Transform",
  category: "Modifier",
  description: "Scale / offset / rotate the sampling domain",
  tags: ["scale", "offset", "rotate"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    scale: num("domain scale", { min: 0.1, max: 8, step: 0.1, default: 1 }),
    offsetX: num("offset X", { min: -50, max: 50, step: 1, default: 0 }),
    offsetZ: num("offset Z", { min: -50, max: 50, step: 1, default: 0 }),
    rotation: num("rotation (deg)", { min: -180, max: 180, step: 1, default: 0 }),
  },
  evaluate: ({ inputs, params }) => {
    const input = expectField(inputs.in, "Transform");
    const scale = params.scale || 1;
    const offsetX = params.offsetX ?? 0;
    const offsetZ = params.offsetZ ?? 0;
    const rad = ((params.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const field: Field = {
      sample: (x, y, z) => {
        const px = (x - offsetX) / scale;
        const pz = (z - offsetZ) / scale;
        return input.sample(px * cos - pz * sin, y, px * sin + pz * cos);
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

export const maskNode: NodeDefinition = {
  type: "mask",
  label: "Mask",
  category: "Modifier",
  description: "Blend A and B by a third field used as a 0..1 mask",
  tags: ["mask", "blend", "select", "mix"],
  inputs: [
    { id: "a", label: "A", type: "field" },
    { id: "b", label: "B", type: "field" },
    { id: "mask", label: "Mask", type: "field" },
  ],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    maskLow: num("mask low", { min: -2, max: 2, step: 0.05, default: 0 }),
    maskHigh: num("mask high", { min: -2, max: 2, step: 0.05, default: 1 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const a = expectField(inputs.a, "Mask A");
    const b = expectField(inputs.b, "Mask B");
    const m = expectField(inputs.mask, "Mask");
    const lo = params.maskLow ?? 0;
    const hi = params.maskHigh ?? 1;
    const span = hi - lo || 1;
    const field: Field = {
      sample: (x, y, z) => {
        const t = clamp01((m.sample(x, y, z) - lo) / span);
        return a.sample(x, y, z) * (1 - t) + b.sample(x, y, z) * t;
      },
      dimensionHint: a.dimensionHint === "3d" || b.dimensionHint === "3d" ? "3d" : "2d",
    };
    return { out: { type: "field", value: field } };
  },
};

export const terraceNode: NodeDefinition = {
  type: "terrace",
  label: "Terrace",
  category: "Modifier",
  description: "Quantise values into flat steps (stratified terrain)",
  tags: ["terrace", "step", "quantise", "strata", "plateau"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    steps: num("steps", { min: 2, max: 40, step: 1, default: 8 }),
    stepScale: num("step scale", { min: 0.1, max: 10, step: 0.1, default: 1 }),
    sharpness: num("sharpness", { min: 0, max: 1, step: 0.02, default: 0.7 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Terrace");
    const steps = Math.max(2, Math.round(params.steps ?? 8));
    const stepScale = params.stepScale || 1;
    const sharp = clamp01(params.sharpness ?? 0.7);
    const field: Field = {
      sample: (x, y, z) => {
        const v = input.sample(x, y, z) / stepScale;
        const floor = Math.floor(v);
        const frac = v - floor;
        // blend between a hard step and the original ramp
        const shaped = frac < 0.5
          ? 0.5 * Math.pow(2 * frac, 1 + sharp * 6)
          : 1 - 0.5 * Math.pow(2 * (1 - frac), 1 + sharp * 6);
        const stepped = floor + (shaped * sharp + frac * (1 - sharp));
        return stepped * stepScale;
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

export const blurNode: NodeDefinition = {
  type: "blur",
  label: "Blur",
  category: "Modifier",
  description: "Box-average the input over a small kernel (softens detail)",
  tags: ["blur", "smooth", "soften", "average"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    radius: num("radius", { min: 0.2, max: 8, step: 0.1, default: 1.5 }),
    taps: num("taps", { min: 2, max: 6, step: 1, default: 3 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Blur");
    const radius = params.radius ?? 1.5;
    const taps = Math.max(2, Math.round(params.taps ?? 3));
    const step = (radius * 2) / (taps - 1);
    const field: Field = {
      sample: (x, y, z) => {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < taps; i++) {
          for (let j = 0; j < taps; j++) {
            const ox = -radius + i * step;
            const oz = -radius + j * step;
            sum += input.sample(x + ox, y, z + oz);
            count++;
          }
        }
        return sum / count;
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

export const remapNode: NodeDefinition = {
  type: "remap",
  label: "Remap",
  category: "Modifier",
  description: "Map an input range onto an output range",
  tags: ["remap", "range", "normalize", "levels"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    inMin: num("in min", { min: -10, max: 10, step: 0.05, default: -1 }),
    inMax: num("in max", { min: -10, max: 10, step: 0.05, default: 1 }),
    outMin: num("out min", { min: -10, max: 10, step: 0.05, default: 0 }),
    outMax: num("out max", { min: -10, max: 10, step: 0.05, default: 1 }),
    clampOutput: toggle("clamp", 1),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Remap");
    const inMin = params.inMin ?? -1;
    const inSpan = (params.inMax ?? 1) - inMin || 1;
    const outMin = params.outMin ?? 0;
    const outSpan = (params.outMax ?? 1) - outMin;
    const doClamp = !!Math.round(params.clampOutput ?? 1);
    const field: Field = {
      sample: (x, y, z) => {
        let t = (input.sample(x, y, z) - inMin) / inSpan;
        if (doClamp) t = clamp01(t);
        return outMin + t * outSpan;
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

export const curveNode: NodeDefinition = {
  type: "curve",
  label: "Curve",
  category: "Modifier",
  description: "Remap field values through gain / bias / gamma / clamp",
  tags: ["remap", "gamma", "clamp", "levels"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    gain: num("gain", { min: 0, max: 5, step: 0.05, default: 1 }),
    bias: num("bias", { min: -10, max: 10, step: 0.1, default: 0 }),
    gamma: num("gamma", { min: 0.1, max: 4, step: 0.05, default: 1 }),
    clampEnabled: toggle("clamp", 0),
    clampMin: num("clamp min", { min: -20, max: 20, step: 0.1, default: -1 }),
    clampMax: num("clamp max", { min: -20, max: 20, step: 0.1, default: 1 }),
  },
  evaluate: ({ inputs, params }) => {
    const input = expectField(inputs.in, "Curve");
    const gain = params.gain ?? 1;
    const bias = params.bias ?? 0;
    const gamma = params.gamma ?? 1;
    const clampOn = !!Math.round(params.clampEnabled ?? 0);
    const lo = params.clampMin ?? -1;
    const hi = params.clampMax ?? 1;
    const field: Field = {
      sample: (x, y, z) => {
        let v = input.sample(x, y, z) * gain + bias;
        if (gamma !== 1) v = Math.sign(v) * Math.pow(Math.abs(v), gamma);
        if (clampOn) v = Math.min(hi, Math.max(lo, v));
        return v;
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};
