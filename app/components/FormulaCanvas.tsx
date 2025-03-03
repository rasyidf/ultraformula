"use client";

import { AdaptiveDpr, ContactShadows, Environment, GizmoHelper, GizmoViewcube, Grid, OrbitControls, PerformanceMonitor, PerspectiveCamera, Stats } from "@react-three/drei";
import type { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Card, CardContent } from "~/components/ui/card";
import type { Formula, FormulaParams } from "~/types/Formula";
import { CanvasMesh } from "./CanvasMesh";

interface FormulaCanvasProps {
  formula: Formula;
  params: FormulaParams;
  backgroundColor: string;
  meshColor: string;
  showGrid: boolean;
  showAxes: boolean;
  scale: number;
  autoRotate: boolean;
  showEnvironment: boolean;
  environmentPreset: string;
  showStats: boolean;
  showShadows: boolean;
  cameraPosition: [number, number, number];
  ambientLightIntensity: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  materialType: "standard" | "wireframe" | "wobble" | "transmission" | "reflector";
  wireframe: boolean;
  enableFloat: boolean;
  outlineColor: string;
  showOutlines: boolean;
}

export function FormulaCanvas({
  formula,
  params,
  backgroundColor,
  meshColor,
  showGrid,
  showAxes,
  scale,
  autoRotate,
  showEnvironment,
  environmentPreset,
  showStats,
  showShadows,
  cameraPosition,
  ambientLightIntensity,
  pointLightIntensity,
  pointLightPosition,
  materialType,
  wireframe,
  enableFloat,
  outlineColor,
  showOutlines
}: FormulaCanvasProps) {
  return (
    <Card className="w-full h-[500px] lg:h-[calc(100vh-12rem)]" style={{ backgroundColor }}>
      <CardContent className="p-0 h-full" >
        <Canvas camera={{ position: cameraPosition }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={cameraPosition} />
            <ambientLight intensity={ambientLightIntensity} />
            <pointLight position={pointLightPosition} intensity={pointLightIntensity} />
            <CanvasMesh
              params={params}
              autoRotate={autoRotate}
              color={meshColor}
              scale={scale} 
              formula={formula}
              materialType={materialType}
              wireframe={wireframe}
              enableFloat={enableFloat}
              outlineColor={outlineColor}
              showOutlines={showOutlines}
            />
            {showAxes && <axesHelper args={[5]} />}
            
            <Grid 
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={3}
              sectionThickness={1}
              sectionColor="#9d4b4b"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
              position={[0, -2, 0]}
              visible={showGrid}
            />
            
            <ContactShadows 
              opacity={0.5} 
              scale={10} 
              blur={1} 
              far={10} 
              resolution={256} 
              color="#000000" 
              position={[0, -2, 0]}
              visible={showShadows}
            />
            
            {showEnvironment && (
              <Environment preset={environmentPreset as PresetsType} background={true} />
            )}
            <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
            
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewcube faces={['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back']} />
            </GizmoHelper>
            
            <AdaptiveDpr pixelated />
            <PerformanceMonitor />
            {showStats && <Stats className="stats" />}
          </Suspense>
        </Canvas>
      </CardContent>
    </Card>
  );
}

