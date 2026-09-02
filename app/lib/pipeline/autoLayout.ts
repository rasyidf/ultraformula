import type { RFEdge, RFNode } from "./graphHelpers";
import { getNodeDefinition } from "./nodes";
import { isParamHandle, paramKeyFromHandle } from "./types";

export interface LayoutNode {
  id: string;
}
export interface LayoutEdge {
  source: string;
  target: string;
}
export interface NodeSize {
  width: number;
  height: number;
}

const NODE_WIDTH = 232;
const HEADER_H = 30;
const ROW_H = 24;
const PARAM_ROW_H = 23;

/** Estimate a node's rendered size without measuring the DOM. */
export function estimateNodeSize(node: RFNode, edges: RFEdge[]): NodeSize {
  const def = getNodeDefinition(node.data.nodeType);
  if (!def) return { width: NODE_WIDTH, height: 90 };

  const linked = new Set(
    edges
      .filter((e) => e.target === node.id && isParamHandle(e.targetHandle))
      .map((e) => paramKeyFromHandle(e.targetHandle as string)),
  );
  const paramCount = Object.keys(def.params).length;
  const shownParams = node.data.expanded ? paramCount : linked.size;
  const hasHiddenRow = !node.data.expanded && shownParams < paramCount;

  let height = HEADER_H + 12;
  height += (def.inputs.length + def.outputs.length) * ROW_H;
  if (shownParams > 0 || hasHiddenRow) {
    height += 8 + shownParams * PARAM_ROW_H + (hasHiddenRow ? 18 : 0);
  }
  return { width: NODE_WIDTH, height };
}

/** Re-position every node with the layered layout, using size estimates. */
export function tidyGraph(nodes: RFNode[], edges: RFEdge[]): RFNode[] {
  const sizes = new Map(nodes.map((n) => [n.id, estimateNodeSize(n, edges)]));
  const positions = layoutGraph(
    nodes.map((n) => ({ id: n.id })),
    edges.map((e) => ({ source: e.source, target: e.target })),
    (id) => sizes.get(id) ?? { width: NODE_WIDTH, height: 100 },
    { originX: 40, originY: 40 },
  );
  return nodes.map((n) =>
    positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n,
  );
}

interface LayoutOpts {
  originX?: number;
  originY?: number;
  gapX?: number;
  gapY?: number;
}

/**
 * Simple layered left-to-right layout: nodes are placed in columns by their
 * longest path from a root, ordered within a column by the average rank of
 * their parents, and each column is vertically centred.
 */
export function layoutGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  sizeOf: (id: string) => NodeSize,
  opts: LayoutOpts = {},
): Map<string, { x: number; y: number }> {
  const gapX = opts.gapX ?? 70;
  const gapY = opts.gapY ?? 34;
  const originX = opts.originX ?? 0;
  const originY = opts.originY ?? 0;

  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const incoming = new Map<string, string[]>();
  for (const id of ids) incoming.set(id, []);
  for (const e of edges) {
    if (!idSet.has(e.source) || !idSet.has(e.target) || e.source === e.target) {
      continue;
    }
    incoming.get(e.target)!.push(e.source);
  }

  const depth = new Map<string, number>();
  const inProgress = new Set<string>();
  const calcDepth = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (inProgress.has(id)) return 0; // cycle guard
    inProgress.add(id);
    const parents = incoming.get(id) ?? [];
    const d = parents.length
      ? Math.max(...parents.map(calcDepth)) + 1
      : 0;
    inProgress.delete(id);
    depth.set(id, d);
    return d;
  };
  ids.forEach(calcDepth);

  const columns = new Map<number, string[]>();
  for (const id of ids) {
    const d = depth.get(id)!;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(id);
  }
  const depths = [...columns.keys()].sort((a, b) => a - b);

  const rank = new Map<string, number>();
  for (const d of depths) {
    const col = columns.get(d)!;
    col.sort((a, b) => {
      const ra = incoming.get(a)!.map((p) => rank.get(p) ?? 0);
      const rb = incoming.get(b)!.map((p) => rank.get(p) ?? 0);
      const ba = ra.length ? ra.reduce((s, v) => s + v, 0) / ra.length : 1e9;
      const bb = rb.length ? rb.reduce((s, v) => s + v, 0) / rb.length : 1e9;
      return ba - bb || a.localeCompare(b);
    });
    col.forEach((id, i) => rank.set(id, i));
  }

  const colX = new Map<number, number>();
  let x = originX;
  for (const d of depths) {
    colX.set(d, x);
    const maxW = Math.max(...columns.get(d)!.map((id) => sizeOf(id).width));
    x += maxW + gapX;
  }

  const colHeight = (d: number) => {
    const col = columns.get(d)!;
    return (
      col.reduce((s, id) => s + sizeOf(id).height, 0) + gapY * (col.length - 1)
    );
  };
  const maxColH = Math.max(...depths.map(colHeight), 0);

  const pos = new Map<string, { x: number; y: number }>();
  for (const d of depths) {
    const col = columns.get(d)!;
    let y = originY + (maxColH - colHeight(d)) / 2;
    for (const id of col) {
      pos.set(id, { x: colX.get(d)!, y });
      y += sizeOf(id).height + gapY;
    }
  }
  return pos;
}
