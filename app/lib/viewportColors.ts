/**
 * Single source of truth for viewport colours. When "match theme" is on the
 * background/mesh/outline follow the active light|dark theme; otherwise the
 * manual overrides from the scene store are used.
 */

export interface ViewportColors {
  background: string;
  mesh: string;
  outline: string;
}

export const VIEWPORT_THEME_COLORS: Record<"light" | "dark", ViewportColors> = {
  light: { background: "#ffffff", mesh: "#18181b", outline: "#ffffff" },
  dark: { background: "#0b0f1a", mesh: "#e5e7eb", outline: "#0b0f1a" },
};

/** Rough perceived-lightness test for a #rrggbb / #rgb string. */
export function isDarkColor(hex: string): boolean {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 0.5;
}

export function resolveViewportColors(
  resolvedTheme: string | undefined,
  scene: {
    syncColorsWithTheme: boolean;
    backgroundColor: string;
    meshColor: string;
    outlineColor: string;
  },
): ViewportColors {
  if (!scene.syncColorsWithTheme) {
    return {
      background: scene.backgroundColor,
      mesh: scene.meshColor,
      outline: scene.outlineColor,
    };
  }
  return resolvedTheme === "light"
    ? VIEWPORT_THEME_COLORS.light
    : VIEWPORT_THEME_COLORS.dark;
}
