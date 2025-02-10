import * as THREE from "three";

export interface ParameterMetadata {
  name: string;
  description: string;
  min: number;
  max: number;
  step: number;
  default?: number;
  isLocked?: boolean;
}

export interface FormulaMetadata {
  name: string;
  description: string;
  parameters: Record<string, ParameterMetadata>;
}

export interface FormulaParams {
  [key: string]: number;
}

export type FormulaFunction = (params: FormulaParams) => number;

export interface Formula {
  metadata: FormulaMetadata;
  calculate: FormulaFunction;
  createGeometry: (params: FormulaParams) => THREE.BufferGeometry;
}

// export interface Formula {
//   calculate: (params: FormulaParams) => number;
//   createGeometry: (params: FormulaParams) => THREE.BufferGeometry;
// }
