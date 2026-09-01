import type { Formula } from "~/types/Formula";
import { getNodeDefinition } from "./nodes";
import { synthesizeFormula } from "./synthesizeFormula";
import type { GraphEdge, GraphNode, NodeError, PortValue } from "./types";

export interface EvalResult {
  formula: Formula | null;
  errors: NodeError[];
  outputValue: PortValue | null;
}

interface CacheEntry {
  hash: string;
  outputs: Record<string, PortValue>;
}

// Persists across calls; editing one param only re-runs its downstream cone.
const cache = new Map<string, CacheEntry>();

export function clearEvalCache() {
  cache.clear();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

export function evaluateGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): EvalResult {
  const errors: NodeError[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const outputNode = nodes.find((n) => n.type === "output");
  if (!outputNode) {
    return {
      formula: null,
      errors: [{ nodeId: "", message: "Add an Output node to render the graph" }],
      outputValue: null,
    };
  }

  const incoming = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e);
  }

  // Upstream cone of the output node, topologically ordered; detect cycles.
  const order: string[] = [];
  const visitState = new Map<string, "visiting" | "done">();
  let cyclic = false;
  const visit = (id: string) => {
    const st = visitState.get(id);
    if (st === "done") return;
    if (st === "visiting") {
      cyclic = true;
      return;
    }
    visitState.set(id, "visiting");
    for (const e of incoming.get(id) ?? []) visit(e.source);
    visitState.set(id, "done");
    order.push(id);
  };
  visit(outputNode.id);

  if (cyclic) {
    return {
      formula: null,
      errors: [{ nodeId: outputNode.id, message: "Graph contains a cycle" }],
      outputValue: null,
    };
  }

  const hashes = new Map<string, string>();
  const outputs = new Map<string, Record<string, PortValue>>();

  for (const id of order) {
    const node = nodeById.get(id)!;
    const def = getNodeDefinition(node.type);
    if (!def) {
      errors.push({ nodeId: id, message: `Unknown node type "${node.type}"` });
      outputs.set(id, {});
      hashes.set(id, `unknown:${id}`);
      continue;
    }

    const inEdges = incoming.get(id) ?? [];
    const upstreamHashes = inEdges
      .map((e) => `${e.targetHandle}<-${hashes.get(e.source) ?? ""}:${e.sourceHandle}`)
      .sort();
    const hash = stableStringify({
      t: node.type,
      p: node.params,
      c: node.config ?? {},
      u: upstreamHashes,
    });
    hashes.set(id, hash);

    const cached = cache.get(id);
    if (cached && cached.hash === hash) {
      outputs.set(id, cached.outputs);
      continue;
    }

    const inputs: Record<string, PortValue | undefined> = {};
    for (const e of inEdges) {
      inputs[e.targetHandle] = outputs.get(e.source)?.[e.sourceHandle];
    }

    try {
      const result = def.evaluate({
        inputs,
        params: node.params,
        config: node.config ?? {},
      });
      outputs.set(id, result);
      cache.set(id, { hash, outputs: result });
    } catch (err) {
      errors.push({
        nodeId: id,
        message: err instanceof Error ? err.message : String(err),
      });
      outputs.set(id, {});
      cache.delete(id);
    }
  }

  const inEdge = (incoming.get(outputNode.id) ?? []).find(
    (e) => e.targetHandle === "in",
  );
  const outputValue = inEdge
    ? outputs.get(inEdge.source)?.[inEdge.sourceHandle] ?? null
    : null;

  if (!outputValue) {
    return {
      formula: null,
      errors: errors.length
        ? errors
        : [{ nodeId: outputNode.id, message: "Connect a node to the Output" }],
      outputValue: null,
    };
  }

  let formula: Formula | null = null;
  try {
    formula = synthesizeFormula(outputValue);
  } catch (err) {
    errors.push({
      nodeId: outputNode.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { formula, errors, outputValue };
}
