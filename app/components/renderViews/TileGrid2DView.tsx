import { useViewportColors } from "~/hooks/useViewportColors";
import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { TileGridCanvas } from "./TileGridCanvas";

export function TileGrid2DView({ formula, params }: RenderViewProps) {
  const showGrid = useSceneStore((s) => s.showGrid);
  const colors = useViewportColors();

  return (
    <TileGridCanvas
      formula={formula}
      params={params}
      backgroundColor={colors.background}
      showGrid={showGrid}
    />
  );
}
