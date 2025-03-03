import * as THREE from "three";

export interface ParameterMetadata {
  name: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  isLocked?: boolean;
  // Properties for advanced controls:
  controlType?: 'toggle' | 'input' | 'select' | 'slider';
  choices?: number[];
}

export interface FormulaMetadata {
  name: string;
  description: string;
  parameters: Record<string, ParameterMetadata>;
  supportedDimensions: ('2d' | '3d')[];
}

export interface FormulaParams {
  [key: string]: number;
}

export type FormulaFunction = (params: FormulaParams) => number;

export interface Formula {
  metadata: FormulaMetadata;
  calculate: FormulaFunction;
  // 3D specific methods
  createGeometry: (params: FormulaParams) => THREE.BufferGeometry;
  // 2D specific methods
  calculate2D?: (x: number, y: number, params: FormulaParams) => number;
  calculateCartesian2D?: (x: number, params: FormulaParams) => number;
  createPlotData?: (params: FormulaParams, resolution: number) => { x: number[]; y: number[] };
}

export interface Point2D {
  x: number;
  y: number;
}

export type PlotType = 'line' | 'scatter' | 'area' | 'heatmap';
