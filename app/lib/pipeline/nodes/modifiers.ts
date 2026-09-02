import { blendModeFromIndex, blendValues, BLEND_MODES } from "../ops/blend";
import { domainWarp } from "../ops/domainWarp";
import type { Field, NodeDefinition, PortValue } from "../types";
import { expectField, num, select, toggle } from "./_shared";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const softplus = (x: number) => (x > 20 ? x : Math.log1p(Math.exp(x)));

/* -------------------------------------------------------------------------- */
/*  Distort — move the sampling domain around                                 */
/* -------------------------------------------------------------------------- */

export const domainWarpNode: NodeDefinition = {
  type: "domainWarp",
  label: "Domain Warp",
  category: "Modifier",
  group: "Distort",
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

export const transformNode: NodeDefinition = {
  type: "transform",
  label: "Transform",
  category: "Modifier",
  group: "Distort",
  description: "Scale / offset / rotate the sampling domain",
  tags: ["scale", "offset", "rotate", "pan"],
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

export const blurNode: NodeDefinition = {
  type: "blur",
  label: "Blur",
  category: "Modifier",
  group: "Distort",
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

/* -------------------------------------------------------------------------- */
/*  Shape — remap the value axis                                              */
/* -------------------------------------------------------------------------- */

/**
 * Levels — the one value-remap node (replaces the old Curve + Remap pair).
 * Maps the input window [inLow, inHigh] onto the output window [outLow, outHigh]
 * with an optional midtone `gamma` and output clamp. Identity by default.
 */
export const levelsNode: NodeDefinition = {
  type: "levels",
  label: "Levels",
  category: "Modifier",
  group: "Shape",
  description: "Remap the value range with input / output windows, gamma and clamp",
  tags: ["levels", "curve", "remap", "gamma", "gain", "bias", "contrast", "clamp"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    inLow: num("in low", { min: -20, max: 20, step: 0.05, default: -1 }),
    inHigh: num("in high", { min: -20, max: 20, step: 0.05, default: 1 }),
    outLow: num("out low", { min: -30, max: 30, step: 0.05, default: -1 }),
    outHigh: num("out high", { min: -30, max: 30, step: 0.05, default: 1 }),
    gamma: num("gamma", { min: 0.1, max: 4, step: 0.05, default: 1 }),
    clamp: toggle("clamp output", 0),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Levels");
    const inLow = params.inLow ?? -1;
    const inSpan = (params.inHigh ?? 1) - inLow || 1;
    const outLow = params.outLow ?? -1;
    const outSpan = (params.outHigh ?? 1) - outLow;
    const gamma = params.gamma ?? 1;
    const doClamp = !!Math.round(params.clamp ?? 0);
    const field: Field = {
      sample: (x, y, z) => {
        let t = (input.sample(x, y, z) - inLow) / inSpan;
        if (doClamp) t = clamp01(t);
        if (gamma !== 1) t = Math.sign(t) * Math.pow(Math.abs(t), gamma);
        return outLow + t * outSpan;
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

export const terraceNode: NodeDefinition = {
  type: "terrace",
  label: "Terrace",
  category: "Modifier",
  group: "Shape",
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
    const stepScale = params.stepScale || 1;
    const sharp = clamp01(params.sharpness ?? 0.7);
    const field: Field = {
      sample: (x, y, z) => {
        const v = input.sample(x, y, z) / stepScale;
        const floor = Math.floor(v);
        const frac = v - floor;
        const shaped =
          frac < 0.5
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

export const thresholdNode: NodeDefinition = {
  type: "threshold",
  label: "Threshold",
  category: "Modifier",
  group: "Shape",
  description: "Cut the field at a level — flat seas, plateau caps, or a mask",
  tags: ["threshold", "level", "sea", "water", "clip", "mask", "plateau"],
  inputs: [{ id: "in", label: "Field", type: "field" }],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    mode: select(
      "mode",
      [0, 1, 2, 3],
      ["Floor (sea)", "Ceil (plateau)", "Binary mask", "Isolate band"],
      0,
    ),
    level: num("level", { min: -20, max: 20, step: 0.1, default: 0 }),
    band: num("band width", { min: 0.05, max: 10, step: 0.05, default: 1 }),
    softness: num("softness", { min: 0, max: 5, step: 0.05, default: 0.2 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const input = expectField(inputs.in, "Threshold");
    const mode = Math.round(params.mode ?? 0);
    const level = params.level ?? 0;
    const band = params.band ?? 1;
    const k = params.softness ?? 0;
    const field: Field = {
      sample: (x, y, z) => {
        const v = input.sample(x, y, z);
        switch (mode) {
          case 0:
            return k <= 0
              ? Math.max(level, v)
              : level + k * softplus((v - level) / k);
          case 1:
            return k <= 0
              ? Math.min(level, v)
              : level - k * softplus((level - v) / k);
          case 2:
            return v >= level ? 1 : -1;
          case 3:
            return Math.abs(v - level) <= band ? 1 : -1;
          default:
            return v;
        }
      },
      dimensionHint: input.dimensionHint,
    };
    return { out: { type: "field", value: field } };
  },
};

/* -------------------------------------------------------------------------- */
/*  Combine — merge two fields                                                */
/* -------------------------------------------------------------------------- */

/**
 * Combine — merges A and B (replaces the old Blend + Mask pair). Blends with
 * `mode` / `mix`; if the optional `mask` input is wired, it fades per-sample
 * from A (mask low) to the blended result (mask high).
 */
export const combineNode: NodeDefinition = {
  type: "combine",
  label: "Combine",
  category: "Modifier",
  group: "Combine",
  description: "Merge two fields (add / multiply / min / max / mix), optional mask",
  tags: ["combine", "blend", "mix", "mask", "add", "multiply", "min", "max"],
  inputs: [
    { id: "a", label: "A", type: "field" },
    { id: "b", label: "B", type: "field" },
    { id: "mask", label: "Mask", type: "field" },
  ],
  outputs: [{ id: "out", label: "Field", type: "field" }],
  params: {
    mode: select("mode", [0, 1, 2, 3, 4], [...BLEND_MODES], 0),
    mix: num("mix amount", { min: 0, max: 1, step: 0.01, default: 0.5 }),
    maskLow: num("mask low", { min: -4, max: 4, step: 0.05, default: 0 }),
    maskHigh: num("mask high", { min: -4, max: 4, step: 0.05, default: 1 }),
  },
  evaluate: ({ inputs, params }): Record<string, PortValue> => {
    const a = expectField(inputs.a, "Combine A");
    const b = expectField(inputs.b, "Combine B");
    const maskInput =
      inputs.mask && inputs.mask.type === "field" ? inputs.mask.value : null;
    const mode = blendModeFromIndex(params.mode ?? 0);
    const mix = params.mix ?? 0.5;
    const lo = params.maskLow ?? 0;
    const span = (params.maskHigh ?? 1) - lo || 1;
    const field: Field = {
      sample: (x, y, z) => {
        const av = a.sample(x, y, z);
        const blended = blendValues(av, b.sample(x, y, z), mode, mix);
        if (!maskInput) return blended;
        const t = clamp01((maskInput.sample(x, y, z) - lo) / span);
        return av * (1 - t) + blended * t;
      },
      dimensionHint:
        a.dimensionHint === "3d" || b.dimensionHint === "3d" ? "3d" : "2d",
    };
    return { out: { type: "field", value: field } };
  },
};
