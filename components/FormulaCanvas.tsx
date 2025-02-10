"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSuperformulaContext } from "@/contexts/FormulaContext";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { SuperformulaMesh } from "./CanvasMesh";

export function FormulaCanvas() {
  const { state, calculateFormula } = useSuperformulaContext();

  return (
    <Card className="w-full h-[500px] lg:h-[calc(100vh-12rem)]" style={{ backgroundColor: state.backgroundColor }}>
      <CardContent className="p-0 h-full" >
        <Canvas camera={{ position: state.cameraPosition }}>
          <ambientLight intensity={state.ambientLightIntensity} />
          <pointLight position={state.pointLightPosition} intensity={state.pointLightIntensity} />
          <SuperformulaMesh
            params={state.params}
            calculateFormula={calculateFormula}
            formulaType={state.formulaType}
            autoRotate={state.autoRotate}
            color={state.meshColor}
            scale={state.scale}
          />
          <OrbitControls />
        </Canvas>
      </CardContent>
    </Card>
  );
}

