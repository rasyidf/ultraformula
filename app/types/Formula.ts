import type * as THREE from "three";

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
  /** Display labels for `choices`, positionally matched. Falls back to the number. */
  choiceLabels?: string[];
}

export interface FormulaMetadata {
  name: string;
  description: string;
  parameters: Record<string, ParameterMetadata>;
  supportedDimensions: ('2d' | '3d')[];
  /**
   * Explicit list of render-view ids this formula can be shown with
   * (e.g. ['mesh3d'], ['tileGrid2d']). When omitted it is inferred from
   * `supportedDimensions`. See app/lib/renderViews.
   */
  renderViews?: string[];
  categories?: string[];
  tags?: string[];
  supportsVertexColors?: boolean; // Whether this formula supports color-coded parts
  colorScheme?: 'gradient' | 'categorical' | 'radial' | 'parametric'; // Default color scheme
}

/** A collapsed tile grid produced by constraint-based formulas (e.g. WFC). */
export interface TileGridResult {
  width: number;
  height: number;
  /** row-major, length width*height; value = palette index, <0 = unresolved/contradiction */
  cells: Int16Array;
  palette: { color: string; label: string }[];
}

export interface FormulaParams {
  [key: string]: number;
}

export type FormulaFunction = (params: FormulaParams) => number;

export interface Formula {
  metadata: FormulaMetadata;
  calculate: FormulaFunction;
  // 3D specific methods
  createGeometry?: (params: FormulaParams) => THREE.BufferGeometry;
  // 2D specific methods
  calculate2D?: (x: number, y: number, params: FormulaParams) => number;
  calculateCartesian2D?: (x: number, params: FormulaParams) => number;
  createPlotData?: (params: FormulaParams, resolution: number) => { x: number[]; y: number[] };
  // Tile-grid / constraint-based methods
  createTileGrid?: (params: FormulaParams) => TileGridResult;
  /**
   * Sample the field onto a square grid for the 2D texture / data-table views.
   * `bounds` is the world-space footprint the grid covers.
   */
  createFieldGrid?: (resolution: number) => {
    width: number;
    height: number;
    data: Float32Array;
    bounds: { minX: number; minZ: number; size: number };
  };
  /** Colourised raster of the field for the 2D texture view. */
  createTexture?: (resolution: number) => {
    width: number;
    height: number;
    /** rgb triples, 0..1, row-major */
    rgb: Float32Array;
  };
  /** Single scalar output (from a Value / Seed / Random node into Output). */
  scalarValue?: number;
  // Color function for color-coded parts
  calculateColor?: (position: THREE.Vector3, params: FormulaParams, uv?: { u: number; v: number }) => THREE.Color;
}

export interface Point2D {
  x: number;
  y: number;
}

export type PlotType = 'line' | 'scatter' | 'area' | 'heatmap';
