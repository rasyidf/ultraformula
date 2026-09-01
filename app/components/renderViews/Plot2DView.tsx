import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { Cartesian2DCanvas } from "../Cartesian2DCanvas";

export function Plot2DView({ formula, params }: RenderViewProps) {
  const s = useSceneStore();

  return (
    <Cartesian2DCanvas
      formula={formula}
      params={params}
      backgroundColor={s.backgroundColor}
      lineColor={s.meshColor}
      showGrid={s.showGrid}
      showAxes={s.showAxes}
      scale={s.scale}
    />
  );
}
