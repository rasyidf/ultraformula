import { useSuperformulaContext } from "~/contexts/FormulaContext";
import type { RenderViewProps } from "~/types/RenderView";
import { FormulaCanvas } from "../FormulaCanvas";

export function Mesh3DView({ formula, params }: RenderViewProps) {
  const { formulaState, canvasSettings, cameraSettings } = useSuperformulaContext();

  return (
    <FormulaCanvas
      formula={formula}
      params={params}
      backgroundColor={canvasSettings.backgroundColor}
      meshColor={formulaState.meshColor}
      showGrid={canvasSettings.showGrid}
      showAxes={canvasSettings.showAxes}
      scale={canvasSettings.scale}
      autoRotate={canvasSettings.autoRotate}
      showEnvironment={canvasSettings.showEnvironment}
      environmentPreset={canvasSettings.environmentPreset}
      showStats={canvasSettings.showStats}
      showShadows={canvasSettings.showShadows}
      cameraPosition={cameraSettings.cameraPosition}
      ambientLightIntensity={cameraSettings.ambientLightIntensity}
      pointLightIntensity={cameraSettings.pointLightIntensity}
      pointLightPosition={cameraSettings.pointLightPosition}
      materialType={formulaState.materialType}
      wireframe={formulaState.wireframe}
      enableFloat={formulaState.enableFloat}
      outlineColor={formulaState.outlineColor}
      showOutlines={formulaState.showOutlines}
      enableVertexColors={canvasSettings.enableVertexColors}
    />
  );
}
