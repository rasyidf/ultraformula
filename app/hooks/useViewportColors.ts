import { useTheme } from "next-themes";
import { resolveViewportColors, type ViewportColors } from "~/lib/viewportColors";
import { useSceneStore } from "~/stores/sceneStore";

export function useViewportColors(): ViewportColors {
  const { resolvedTheme } = useTheme();
  const syncColorsWithTheme = useSceneStore((s) => s.syncColorsWithTheme);
  const backgroundColor = useSceneStore((s) => s.backgroundColor);
  const meshColor = useSceneStore((s) => s.meshColor);
  const outlineColor = useSceneStore((s) => s.outlineColor);

  return resolveViewportColors(resolvedTheme, {
    syncColorsWithTheme,
    backgroundColor,
    meshColor,
    outlineColor,
  });
}
