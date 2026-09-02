import { useShallow } from "zustand/react/shallow";
import { useViewportColors } from "~/hooks/useViewportColors";
import { useSceneStore } from "~/stores/sceneStore";
import type { RenderViewProps } from "~/types/RenderView";
import { FormulaCanvas } from "../FormulaCanvas";

export function Mesh3DView({ formula, params, thumbnail }: RenderViewProps) {
  const s = useSceneStore(
    useShallow((st) => ({
      showGrid: st.showGrid,
      showAxes: st.showAxes,
      scale: st.scale,
      autoRotate: st.autoRotate,
      showEnvironment: st.showEnvironment,
      environmentPreset: st.environmentPreset,
      showStats: st.showStats,
      showShadows: st.showShadows,
      cameraPosition: st.cameraPosition,
      ambientLightIntensity: st.ambientLightIntensity,
      pointLightIntensity: st.pointLightIntensity,
      pointLightPosition: st.pointLightPosition,
      materialType: st.materialType,
      wireframe: st.wireframe,
      enableFloat: st.enableFloat,
      showOutlines: st.showOutlines,
      enableVertexColors: st.enableVertexColors,
      adaptiveDpr: st.adaptiveDpr,
    })),
  );
  const colors = useViewportColors();

  return (
    <FormulaCanvas
      formula={formula}
      params={params}
      thumbnail={thumbnail}
      backgroundColor={colors.background}
      meshColor={colors.mesh}
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
      outlineColor={colors.outline}
      showOutlines={s.showOutlines}
      enableVertexColors={s.enableVertexColors}
      adaptiveDpr={s.adaptiveDpr}
    />
  );
}
