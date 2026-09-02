import { useViewportColors } from "~/hooks/useViewportColors";
import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { Cartesian2DCanvas } from "../Cartesian2DCanvas";

export function Plot2DView({ formula, params }: RenderViewProps) {
  const showGrid = useSceneStore((s) => s.showGrid);
  const showAxes = useSceneStore((s) => s.showAxes);
  const scale = useSceneStore((s) => s.scale);
  const colors = useViewportColors();

  return (
    <Cartesian2DCanvas
      formula={formula}
      params={params}
      backgroundColor={colors.background}
      lineColor={colors.mesh}
      showGrid={showGrid}
      showAxes={showAxes}
      scale={scale}
    />
  );
}
