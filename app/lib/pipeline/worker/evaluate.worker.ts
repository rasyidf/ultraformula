import { evaluateGraph } from "../evaluate";
import type { EvalEnv, GraphEdge, GraphNode } from "../types";

/**
 * Off-main-thread graph evaluation. Receives plain `{nodes, edges, env}`, runs
 * the same `evaluateGraph` as the sync fallback, and posts back a `RenderPayload`
 * as a structured clone. The module-level eval cache in `evaluate.ts` persists
 * for the worker's lifetime, so a cached node output can appear in more than one
 * payload — transferring its ArrayBuffers would detach the cached copy and make
 * the next `postMessage` throw. The clone (~1 MB/eval, debounced) avoids that.
 */

interface Request {
  id: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  env: EvalEnv;
}

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Request>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

ctx.onmessage = (e) => {
  const { id, nodes, edges, env } = e.data;
  let out;
  try {
    out = evaluateGraph(nodes, edges, env);
  } catch (err) {
    out = {
      payload: null,
      errors: [
        { nodeId: "", message: err instanceof Error ? err.message : String(err) },
      ],
    };
  }
  ctx.postMessage({ id, ...out });
};
