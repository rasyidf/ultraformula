import { useSuperformulaContext } from "~/contexts/FormulaContext";
import type { RenderViewProps } from "~/types/RenderView";
import { TileGridCanvas } from "./TileGridCanvas";

export function TileGrid2DView({ formula, params }: RenderViewProps) {
  const { canvasSettings } = useSuperformulaContext();

  return (
    <TileGridCanvas
      formula={formula}
      params={params}
      backgroundColor={canvasSettings.backgroundColor}
      showGrid={canvasSettings.showGrid}
    />
  );
}
