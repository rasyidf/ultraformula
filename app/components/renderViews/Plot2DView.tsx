import { useViewportColors } from "~/hooks/useViewportColors";
import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { Cartesian2DCanvas } from "../Cartesian2DCanvas";

export function Plot2DView({ formula, params }: RenderViewProps) {
  const s = useSceneStore();
  const colors = useViewportColors();

  return (
    <Cartesian2DCanvas
      formula={formula}
      params={params}
      backgroundColor={colors.background}
      lineColor={colors.mesh}
      showGrid={s.showGrid}
      showAxes={s.showAxes}
      scale={s.scale}
    />
  );
}
