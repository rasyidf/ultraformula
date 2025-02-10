import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Formula, FormulaParams } from "../types/Formula";

interface SuperformulaMeshProps {
  params: FormulaParams;
  formula: Formula;
  autoRotate: boolean;
  color: string;
  scale?: number;
}

export const SuperformulaMesh: React.FC<SuperformulaMeshProps> = ({
  params,
  formula,
  autoRotate,
  color,
  scale = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return formula.createGeometry(params);
  }, [params, formula]);

  useFrame(() => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={scale}>
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  );
};
