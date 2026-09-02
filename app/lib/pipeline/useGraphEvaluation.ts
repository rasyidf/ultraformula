import { startTransition, useEffect, useMemo, useState } from "react";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useSceneStore } from "~/stores/sceneStore";
import { useUiStore } from "~/stores/uiStore";
import { evaluateGraph, type EvalResult } from "./evaluate";
import { toGraphEdges, toGraphNodes } from "./graphHelpers";

export type EvalStatus = "idle" | "evaluating" | "error" | "paused";

const EMPTY: EvalResult = { formula: null, errors: [], outputValue: null };

/**
 * Subscribes to the pipeline store, debounces during rapid edits (slider drags)
 * and re-evaluates the graph on the main thread. The worker swap happens behind
 * this same interface.
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

  const [result, setResult] = useState<EvalResult>(EMPTY);
  const [status, setStatus] = useState<EvalStatus>("idle");

  useEffect(() => {
    if (paused) {
      setStatus("paused");
      return;
    }
    setStatus("evaluating");
    const handle = setTimeout(() => {
      let r: EvalResult;
      try {
        r = evaluateGraph(graphNodes, graphEdges, env);
      } catch (err) {
        r = {
          formula: null,
          outputValue: null,
          errors: [
            { nodeId: "", message: err instanceof Error ? err.message : String(err) },
          ],
        };
      }
      startTransition(() => {
        setResult(r);
        setStatus(r.errors.length > 0 ? "error" : "idle");
      });
    }, Math.max(0, debounceMs));
    return () => clearTimeout(handle);
  }, [graphNodes, graphEdges, env, debounceMs, paused]);

  return { ...result, status };
}
