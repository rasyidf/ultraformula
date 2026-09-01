import { useSuperformulaContext } from "~/contexts/FormulaContext";
import type { RenderViewProps } from "~/types/RenderView";
import { Cartesian2DCanvas } from "../Cartesian2DCanvas";

export function Plot2DView({ formula, params }: RenderViewProps) {
  const { formulaState, canvasSettings } = useSuperformulaContext();

  return (
    <Cartesian2DCanvas
      formula={formula}
      params={params}
      backgroundColor={canvasSettings.backgroundColor}
      lineColor={formulaState.meshColor}
      showGrid={canvasSettings.showGrid}
      showAxes={canvasSettings.showAxes}
      scale={canvasSettings.scale}
    />
  );
}
