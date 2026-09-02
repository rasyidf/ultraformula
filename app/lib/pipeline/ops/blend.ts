export const BLEND_MODES = ["add", "multiply", "min", "max", "mix"] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

export function blendModeFromIndex(index: number): BlendMode {
  const i = Math.min(BLEND_MODES.length - 1, Math.max(0, Math.round(index)));
  return BLEND_MODES[i];
}

export function blendValues(
  a: number,
  b: number,
  mode: BlendMode,
  mix = 0.5,
): number {
  switch (mode) {
    case "add":
      return a + b;
    case "multiply":
      return a * b;
    case "min":
      return Math.min(a, b);
    case "max":
      return Math.max(a, b);
    case "mix":
      return a * (1 - mix) + b * mix;
    default:
      return a;
  }
}
