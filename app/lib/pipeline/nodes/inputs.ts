import type { NodeDefinition, PortValue } from "../types";
import { num } from "./_shared";

/** Deterministic PRNG so a given seed always yields the same value. */
function mulberry32(seed: number): number {
  let t = (Math.floor(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A constant scalar — wire it into any parameter socket. */
export const valueNode: NodeDefinition = {
  type: "value",
  label: "Value",
  category: "Input",
  description: "A constant number to drive a parameter socket",
  tags: ["value", "constant", "number", "param"],
  inputs: [],
  outputs: [{ id: "number", label: "Number", type: "number" }],
  params: {
    value: num("value", { min: -1000, max: 1000, step: 0.01, default: 1 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => ({
    number: { type: "number", value: params.value ?? 0 },
  }),
};

/** An integer seed — share one across several noise nodes. */
export const seedNode: NodeDefinition = {
  type: "seed",
  label: "Seed",
  category: "Input",
  description: "An integer seed to feed noise / simulation nodes",
  tags: ["seed", "random", "noise", "rng"],
  inputs: [],
  outputs: [{ id: "number", label: "Seed", type: "number" }],
  params: {
    seed: num("seed", { min: 0, max: 99999, step: 1, default: 42 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => ({
    number: { type: "number", value: Math.round(params.seed ?? 0) },
  }),
};

/** A seeded pseudo-random number in [min, max] — bump the seed to re-roll. */
export const randomNode: NodeDefinition = {
  type: "random",
  label: "Random",
  category: "Input",
  description: "A seeded random number in a range (deterministic per seed)",
  tags: ["random", "noise", "jitter", "range"],
  inputs: [],
  outputs: [{ id: "number", label: "Number", type: "number" }],
  params: {
    min: num("min", { min: -100, max: 100, step: 0.01, default: 0 }),
    max: num("max", { min: -100, max: 100, step: 0.01, default: 1 }),
    seed: num("seed", { min: 0, max: 99999, step: 1, default: 1 }),
    quantize: num("quantize", { min: 0, max: 10, step: 1, default: 0 }),
  },
  evaluate: ({ params }): Record<string, PortValue> => {
    const min = params.min ?? 0;
    const max = params.max ?? 1;
    const r = mulberry32(params.seed ?? 1);
    let v = min + r * (max - min);
    const q = Math.round(params.quantize ?? 0);
    if (q > 0) v = Math.round(v / q) * q;
    return { number: { type: "number", value: v } };
  },
};
