import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FormulaParams } from "../hooks/useFormula";

interface SuperformulaMeshProps {
  params: FormulaParams;
  calculateFormula: (params: FormulaParams) => number;
  formulaType: string;
  autoRotate: boolean;
  color: string;
  scale?: number;
}

export const SuperformulaMesh: React.FC<SuperformulaMeshProps> = ({
  params,
  calculateFormula,
  formulaType,
  autoRotate,
  color,
  scale = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    if (formulaType === 'gielis') {
      return createGielisGeometry(params, calculateFormula);
    } else if (formulaType === 'terrainGen') {
      return createTerrainGeometry(params, calculateFormula);
    }
    return new THREE.BufferGeometry();
  }, [params, calculateFormula, formulaType]);

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

function createGielisGeometry(params: FormulaParams, calculateFormula: (params: FormulaParams) => number) {
  const uRange = { start: -Math.PI, end: Math.PI, step: 0.05 };
  const vRange = { start: -Math.PI / 2, end: Math.PI / 2, step: 0.05 };
  const nu = Math.floor((uRange.end - uRange.start) / uRange.step) + 1;
  const nv = Math.floor((vRange.end - vRange.start) / vRange.step) + 1;

  const vertices = [];
  const indices = [];

  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const u = uRange.start + i * uRange.step;
      const v = vRange.start + j * vRange.step;

      const r1 = calculateFormula({ ...params, phi: u });
      const r2 = calculateFormula({ ...params, phi: v });

      const x = r1 * Math.cos(u) * r2 * Math.cos(v);
      const y = r1 * Math.sin(u) * r2 * Math.cos(v);
      const z = r2 * Math.sin(v);

      vertices.push(x, y, z);

      if (i < nu - 1 && j < nv - 1) {
        const a = i * nv + j;
        const b = i * nv + j + 1;
        const c = (i + 1) * nv + j;
        const d = (i + 1) * nv + j + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createTerrainGeometry(params: FormulaParams, calculateFormula: (params: FormulaParams) => number) {
  const gridSize = 50;
  const vertices = [];
  const indices = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i - gridSize / 2);
      const z = (j - gridSize / 2);
      const y = calculateFormula({ ...params, x, y: 0, z });

      vertices.push(x, y, z);

      if (i < gridSize - 1 && j < gridSize - 1) {
        const a = i * gridSize + j;
        const b = i * gridSize + j + 1;
        const c = (i + 1) * gridSize + j;
        const d = (i + 1) * gridSize + j + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
