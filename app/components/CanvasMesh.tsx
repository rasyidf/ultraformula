import { Float, MeshReflectorMaterial, MeshTransmissionMaterial, MeshWobbleMaterial, Outlines } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Formula, FormulaParams } from "~/types/Formula";

interface SuperformulaMeshProps {
  params: FormulaParams;
  formula: Formula;
  autoRotate: boolean;
  color: string;
  scale?: number;
  materialType?: "standard" | "wireframe" | "wobble" | "transmission" | "reflector";
  wireframe?: boolean;
  enableFloat?: boolean;
  outlineColor?: string;
  showOutlines?: boolean;
  enableVertexColors?: boolean; // Enable color-coded parts
}

export const CanvasMesh: React.FC<SuperformulaMeshProps> = ({
  params,
  formula,
  autoRotate,
  color,
  scale = 1,
  materialType = "standard",
  wireframe = true,
  enableFloat = false,
  outlineColor = "#ffffff",
  showOutlines = false,
  enableVertexColors = true // Default to true to show color-coded parts
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return formula.createGeometry?.(params) ?? new THREE.BufferGeometry();
  }, [params, formula]);

  // Free the previous geometry's GPU buffers when it's replaced / unmounted —
  // a fresh one is built on every graph evaluation.
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  // Only honour vertex colours when the geometry actually carries a colour
  // attribute; otherwise fall back to the (theme-driven) mesh colour.
  const useVertexColors = enableVertexColors && !!formula.metadata.supportsVertexColors;
  const materialColor = useVertexColors ? "#ffffff" : color;

  const renderMesh = () => {
    const mesh = (
      <mesh ref={meshRef} geometry={geometry} scale={scale}>
        {materialType === "standard" && (
          <meshStandardMaterial
            color={materialColor}
            wireframe={wireframe}
            vertexColors={useVertexColors}
            roughness={0.85}
            metalness={0.04}
            flatShading={false}
          />
        )}
        {materialType === "wobble" && (
          <MeshWobbleMaterial
            color={materialColor}
            factor={0.6}
            speed={1}
            wireframe={wireframe}
          />
        )}
        {materialType === "transmission" && (
          <MeshTransmissionMaterial
            color={materialColor}
            resolution={256}
            thickness={0.5}
            roughness={0.15}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            envMapIntensity={1}
            ior={1.5}
            distortion={0.2}
            distortionScale={0.5}
            temporalDistortion={0.1}
            transmissionSampler
          />
        )}
        {materialType === "reflector" && (
          <MeshReflectorMaterial
            color={materialColor}
            roughness={0.5}
            metalness={0.8}
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={0.5}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            depthScale={1}
          />
        )}
        {showOutlines && <Outlines thickness={0.05} color={outlineColor} />}
      </mesh>
    );

    if (enableFloat) {
      return (
        <Float 
          speed={1.5} 
          rotationIntensity={0.5} 
          floatIntensity={0.5}
        >
          {mesh}
        </Float>
      );
    }
    
    return mesh;
  };

  return renderMesh();
};
