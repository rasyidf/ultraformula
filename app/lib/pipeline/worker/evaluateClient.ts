import { evaluateGraph, type EvalResult } from "../evaluate";
import type { EvalEnv, GraphEdge, GraphNode } from "../types";

/**
 * Thin client over `evaluate.worker.ts`. Falls back to synchronous main-thread
 * evaluation during SSR or when Workers are unavailable, so callers get one
 * uniform `Promise<EvalResult>` interface.
 */

type Args = [GraphNode[], GraphEdge[], EvalEnv];

interface Pending {
  resolve: (r: EvalResult) => void;
  args: Args;
}

let worker: Worker | null | undefined;
let seq = 0;
const pending = new Map<number, Pending>();

function fallbackAll() {
  for (const { resolve, args } of pending.values()) {
    resolve(safeSync(...args));
  }
  pending.clear();
}

function safeSync(...args: Args): EvalResult {
  try {
    return evaluateGraph(...args);
  } catch (err) {
    return {
      payload: null,
      errors: [
        { nodeId: "", message: err instanceof Error ? err.message : String(err) },
      ],
    };
  }
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === "undefined") {
    worker = null;
    return null;
  }
  try {
    worker = new Worker(new URL("./evaluate.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<{ id: number } & EvalResult>) => {
      const { id, payload, errors } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      p.resolve({ payload, errors });
    };
    worker.onerror = () => {
      worker = null;
      fallbackAll();
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function evaluateGraphAsync(
  nodes: GraphNode[],
  edges: GraphEdge[],
  env: EvalEnv,
): Promise<EvalResult> {
  const w = getWorker();
  if (!w) return Promise.resolve(safeSync(nodes, edges, env));
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, { resolve, args: [nodes, edges, env] });
    w.postMessage({ id, nodes, edges, env });
  });
}
