import type {
  FormulaParams,
  ParameterMetadata,
  TileGridResult,
} from "~/types/Formula";

/** The small set of value types that flow along wires. */
export type PortType =
  | "field"
  | "heightmap"
  | "tilegrid"
  | "geometry"
  | "number";

/** A lazily-sampled scalar field over 2D/3D space. */
export interface Field {
  sample: (x: number, y: number, z: number) => number;
  dimensionHint: "2d" | "3d";
  /**
   * Preferred geometry builder (a formula-backed generator supplies its own
   * mesh here). When absent, consumers fall back to a grid sampler over
   * `sample`.
   */
  makeGeometry?: () => GeometryData;
  /** Preferred 2D plot builder (falls back to sampling `sample` along x). */
  makePlot?: (resolution: number) => { x: number[]; y: number[] };
}

/** A materialized regular grid of heights. */
export interface Heightmap {
  width: number;
  height: number;
  /** row-major, length width*height */
  data: Float32Array;
  bounds: { minX: number; minZ: number; size: number };
}

/** Plain-array geometry (assembled into a BufferGeometry on the main thread). */
export interface GeometryData {
  positions: Float32Array;
  indices?: Uint32Array;
  normals?: Float32Array;
  colors?: Float32Array;
}

export type PortValue =
  | { type: "field"; value: Field }
  | { type: "heightmap"; value: Heightmap }
  | { type: "tilegrid"; value: TileGridResult }
  | { type: "geometry"; value: GeometryData }
  | { type: "number"; value: number };

export interface PortSpec {
  id: string;
  label: string;
  type: PortType;
}

export interface EvalContext {
  inputs: Record<string, PortValue | undefined>;
  params: FormulaParams;
  /** Free-text config values (e.g. an expression string). */
  config: Record<string, string>;
}

/** A non-numeric (string) config field rendered as a textarea in the inspector. */
export interface ConfigField {
  key: string;
  label: string;
  description?: string;
  default: string;
  multiline?: boolean;
}

export type NodeCategory =
  | "Input"
  | "Generator"
  | "Noise"
  | "Modifier"
  | "Simulation"
  | "Constraint"
  | "Output";

/** Prefix for a handle that drives a node parameter (e.g. "param:seed"). */
export const PARAM_HANDLE_PREFIX = "param:";
export const isParamHandle = (id?: string | null): id is string =>
  !!id && id.startsWith(PARAM_HANDLE_PREFIX);
export const paramKeyFromHandle = (id: string): string =>
  id.slice(PARAM_HANDLE_PREFIX.length);

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  description?: string;
  tags?: string[];
  inputs: PortSpec[];
  outputs: PortSpec[];
  params: Record<string, ParameterMetadata>;
  configFields?: ConfigField[];
  evaluate: (ctx: EvalContext) => Record<string, PortValue>;
}

export interface GraphNode {
  id: string;
  type: string;
  params: FormulaParams;
  config?: Record<string, string>;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface NodeError {
  nodeId: string;
  message: string;
}

export const PORT_COLORS: Record<PortType, string> = {
  field: "#60a5fa",
  heightmap: "#34d399",
  tilegrid: "#f59e0b",
  geometry: "#a78bfa",
  number: "#94a3b8",
};
