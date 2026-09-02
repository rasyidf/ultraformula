import { getNodeDefinition } from "./nodes";
import { payloadFromPortValue, type RenderPayload } from "./renderPayload";
import {
  DEFAULT_EVAL_ENV,
  isParamHandle,
  paramKeyFromHandle,
  type EvalEnv,
  type GraphEdge,
  type GraphNode,
  type NodeError,
  type PortValue,
} from "./types";

export interface EvalResult {
  /** Serialisable render snapshot — `null` when the graph produced nothing. */
  payload: RenderPayload | null;
  errors: NodeError[];
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
  env: EvalEnv = DEFAULT_EVAL_ENV,
): EvalResult {
  const errors: NodeError[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const outputNode = nodes.find((n) => n.type === "output");
  if (!outputNode) {
    return {
      payload: null,
      errors: [{ nodeId: "", message: "Add an Output node to render the graph" }],
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
      payload: null,
      errors: [{ nodeId: outputNode.id, message: "Graph contains a cycle" }],
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

    const inputs: Record<string, PortValue | undefined> = {};
    const paramOverrides: Record<string, number> = {};
    for (const e of inEdges) {
      const upstream = outputs.get(e.source)?.[e.sourceHandle];
      if (isParamHandle(e.targetHandle)) {
        if (upstream && upstream.type === "number") {
          paramOverrides[paramKeyFromHandle(e.targetHandle)] = upstream.value;
        }
      } else {
        inputs[e.targetHandle] = upstream;
      }
    }
    const effectiveParams = { ...node.params, ...paramOverrides };

    const upstreamHashes = inEdges
      .map((e) => `${e.targetHandle}<-${hashes.get(e.source) ?? ""}:${e.sourceHandle}`)
      .sort();
    const hash = stableStringify({
      t: node.type,
      p: effectiveParams,
      c: node.config ?? {},
      e: env,
      u: upstreamHashes,
    });
    hashes.set(id, hash);

    const cached = cache.get(id);
    if (cached && cached.hash === hash) {
      outputs.set(id, cached.outputs);
      continue;
    }

    try {
      const result = def.evaluate({
        inputs,
        params: effectiveParams,
        config: node.config ?? {},
        env,
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
      payload: null,
      errors: errors.length
        ? errors
        : [{ nodeId: outputNode.id, message: "Connect a node to the Output" }],
    };
  }

  let payload: RenderPayload | null = null;
  try {
    payload = payloadFromPortValue(outputValue);
  } catch (err) {
    errors.push({
      nodeId: outputNode.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { payload, errors };
}
