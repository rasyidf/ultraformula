import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { FormulaCanvas } from "../FormulaCanvas";

export function Mesh3DView({ formula, params }: RenderViewProps) {
  const s = useSceneStore();

  return (
    <FormulaCanvas
      formula={formula}
      params={params}
      backgroundColor={s.backgroundColor}
      meshColor={s.meshColor}
      showGrid={s.showGrid}
      showAxes={s.showAxes}
      scale={s.scale}
      autoRotate={s.autoRotate}
      showEnvironment={s.showEnvironment}
      environmentPreset={s.environmentPreset}
      showStats={s.showStats}
      showShadows={s.showShadows}
      cameraPosition={s.cameraPosition}
      ambientLightIntensity={s.ambientLightIntensity}
      pointLightIntensity={s.pointLightIntensity}
      pointLightPosition={s.pointLightPosition}
      materialType={s.materialType}
      wireframe={s.wireframe}
      enableFloat={s.enableFloat}
      outlineColor={s.outlineColor}
      showOutlines={s.showOutlines}
      enableVertexColors={s.enableVertexColors}
    />
  );
}
