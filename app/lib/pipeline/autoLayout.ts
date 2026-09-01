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
