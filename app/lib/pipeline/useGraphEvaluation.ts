import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { Formula } from "~/types/Formula";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useSceneStore } from "~/stores/sceneStore";
import { useUiStore } from "~/stores/uiStore";
import type { NodeError } from "./types";
import { toGraphEdges, toGraphNodes } from "./graphHelpers";
import { payloadToFormula } from "./payloadToFormula";
import { evaluateGraphAsync } from "./worker/evaluateClient";

export type EvalStatus = "idle" | "evaluating" | "error" | "paused";

interface EvalState {
  formula: Formula | null;
  errors: NodeError[];
}

const EMPTY: EvalState = { formula: null, errors: [] };

/**
 * Subscribes to the pipeline store, debounces during rapid edits (slider drags)
 * and re-evaluates the graph in a Worker (with a synchronous fallback). The
 * serialisable `RenderPayload` that comes back is rehydrated into a `Formula`
 * here on the main thread.
 */
export function useGraphEvaluation() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const debounceMs = useUiStore((s) => s.evalDebounceMs);
  const paused = useUiStore((s) => s.evalPaused);
  const simResolutionCap = useSceneStore((s) => s.simResolutionCap);

  const graphNodes = useMemo(() => toGraphNodes(nodes), [nodes]);
  const graphEdges = useMemo(() => toGraphEdges(edges), [edges]);
  const env = useMemo(() => ({ simResolutionCap }), [simResolutionCap]);

  const [state, setState] = useState<EvalState>(EMPTY);
  const [status, setStatus] = useState<EvalStatus>("idle");
  const runId = useRef(0);

  useEffect(() => {
    if (paused) {
      setStatus("paused");
      return;
    }
    setStatus("evaluating");
    let cancelled = false;
    const handle = setTimeout(() => {
      const id = ++runId.current;
      evaluateGraphAsync(graphNodes, graphEdges, env).then(({ payload, errors }) => {
        if (cancelled || id !== runId.current) return; // superseded / unmounted
        let formula: Formula | null = null;
        const errs = [...errors];
        if (payload) {
          try {
            formula = payloadToFormula(payload);
          } catch (err) {
            errs.push({
              nodeId: "",
              message: err instanceof Error ? err.message : String(err),
            });
          }
        }
        startTransition(() => {
          setState({ formula, errors: errs });
          setStatus(errs.length > 0 ? "error" : "idle");
        });
      });
    }, Math.max(0, debounceMs));
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [graphNodes, graphEdges, env, debounceMs, paused]);

  return { ...state, status };
}
