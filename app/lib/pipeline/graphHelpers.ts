import type { Edge, Node } from "@xyflow/react";
import type { FormulaParams } from "~/types/Formula";
import { getNodeDefinition } from "./nodes";
import { isParamHandle, type GraphEdge, type GraphNode } from "./types";

export interface PipelineNodeData {
  nodeType: string;
  params: FormulaParams;
  config: Record<string, string>;
  /** show every parameter row (with its input socket) on the node body */
  expanded?: boolean;
  [key: string]: unknown;
}

export type RFNode = Node<PipelineNodeData>;
export type RFEdge = Edge;

let idCounter = 0;
export function nextId(prefix = "n"): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter}`;
}

export function defaultParams(type: string): FormulaParams {
  const def = getNodeDefinition(type);
  const params: FormulaParams = {};
  if (!def) return params;
  for (const [key, meta] of Object.entries(def.params)) {
    params[key] = meta.default ?? meta.min ?? 0;
  }
  return params;
}

export function defaultConfig(type: string): Record<string, string> {
  const def = getNodeDefinition(type);
  const config: Record<string, string> = {};
  for (const field of def?.configFields ?? []) config[field.key] = field.default;
  return config;
}

export function makeNode(
  type: string,
  position: { x: number; y: number },
  id = nextId(),
): RFNode {
  return {
    id,
    type: "pipelineNode",
    position,
    data: {
      nodeType: type,
      params: defaultParams(type),
      config: defaultConfig(type),
      expanded: false,
    },
  };
}

export function toGraphNodes(nodes: RFNode[]): GraphNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    params: n.data.params,
    config: n.data.config,
    position: n.position,
  }));
}

export function toGraphEdges(edges: RFEdge[]): GraphEdge[] {
  return edges
    .filter((e) => e.sourceHandle && e.targetHandle)
    .map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle as string,
      target: e.target,
      targetHandle: e.targetHandle as string,
    }));
}

/**
 * Can `type` be spliced into `edge` (drop-on-connection)? Returns the handles to
 * use on the new node, or null if it wouldn't fit.
 */
export function edgeInsertPlan(
  type: string,
  edge: RFEdge,
  nodes: RFNode[],
): { inHandle: string; outHandle: string } | null {
  if (isParamHandle(edge.targetHandle)) return null;
  const newDef = getNodeDefinition(type);
  const srcNode = nodes.find((n) => n.id === edge.source);
  const tgtNode = nodes.find((n) => n.id === edge.target);
  if (!newDef || !srcNode || !tgtNode) return null;

  const srcDef = getNodeDefinition(srcNode.data.nodeType);
  const tgtDef = getNodeDefinition(tgtNode.data.nodeType);
  if (!srcDef || !tgtDef) return null;

  const srcType = srcDef.outputs.find((p) => p.id === edge.sourceHandle)?.type;
  if (!srcType || srcType === "number") return null;

  const inHandle = newDef.inputs.find((p) => p.type === srcType)?.id;
  if (!inHandle) return null;

  let outHandle: string | undefined;
  if (tgtDef.type === "output") {
    // Output accepts field / heightmap / tilegrid / geometry — take any.
    outHandle = (
      newDef.outputs.find((p) => p.type === srcType) ??
      newDef.outputs.find((p) => p.type !== "number") ??
      newDef.outputs[0]
    )?.id;
  } else {
    const tgtType = tgtDef.inputs.find((p) => p.id === edge.targetHandle)?.type;
    outHandle = newDef.outputs.find((p) => p.type === tgtType)?.id;
  }
  if (!outHandle) return null;
  return { inHandle, outHandle };
}

/** Default graph: Perlin terrain -> Output. */
export function seedGraph(): { nodes: RFNode[]; edges: RFEdge[] } {
  const gen = makeNode("gen:terrainGen", { x: 80, y: 120 }, "seed-generator");
  const out = makeNode("output", { x: 460, y: 160 }, "seed-output");
  return {
    nodes: [gen, out],
    edges: [
      {
        id: "seed-edge",
        source: gen.id,
        sourceHandle: "field",
        target: out.id,
        targetHandle: "in",
      },
    ],
  };
}
