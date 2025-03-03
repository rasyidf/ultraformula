import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { getFormula } from "~/lib/formulas";
import { Cartesian2DCanvas } from "./Cartesian2DCanvas";
import { FormulaCanvas } from "./FormulaCanvas";

export function FormulaCanvasWrapper() {
  const { 
    formulaState, 
    canvasSettings, 
    cameraSettings,
  } = useSuperformulaContext();

  const formula = getFormula(formulaState.formulaType);
  const is2DMode = canvasSettings.renderMode === '2d';
  
  if (is2DMode && formula.createPlotData) {
    return (
      <Cartesian2DCanvas
        formula={formula}
        params={formulaState.params}
        backgroundColor={canvasSettings.backgroundColor}
        lineColor={formulaState.meshColor}
        showGrid={canvasSettings.showGrid}
        showAxes={canvasSettings.showAxes}
        scale={canvasSettings.scale}
      />
    );
  }

  return (
    <FormulaCanvas
      formula={formula}
      params={formulaState.params}
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
    />
  );
}