import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { TileGridCanvas } from "./TileGridCanvas";

export function TileGrid2DView({ formula, params }: RenderViewProps) {
  const s = useSceneStore();

  return (
    <TileGridCanvas
      formula={formula}
      params={params}
      backgroundColor={s.backgroundColor}
      showGrid={s.showGrid}
    />
  );
}
