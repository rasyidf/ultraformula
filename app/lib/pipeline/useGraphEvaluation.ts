import { useEffect, useState } from "react";
import { usePipelineStore } from "~/stores/pipelineStore";
import { evaluateGraph, type EvalResult } from "./evaluate";
import { toGraphEdges, toGraphNodes } from "./graphHelpers";

export type EvalStatus = "idle" | "evaluating" | "error";

const EMPTY: EvalResult = { formula: null, errors: [], outputValue: null };

/**
 * Subscribes to the pipeline store, debounces during rapid edits (slider drags)
 * and re-evaluates the graph on the main thread. The worker swap happens behind
 * this same interface.
 */
export function useGraphEvaluation() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const [result, setResult] = useState<EvalResult>(EMPTY);
  const [status, setStatus] = useState<EvalStatus>("idle");

  useEffect(() => {
    setStatus("evaluating");
    const handle = setTimeout(() => {
      let r: EvalResult;
      try {
        r = evaluateGraph(toGraphNodes(nodes), toGraphEdges(edges));
      } catch (err) {
        r = {
          formula: null,
          outputValue: null,
          errors: [
            { nodeId: "", message: err instanceof Error ? err.message : String(err) },
          ],
        };
      }
      setResult(r);
      setStatus(r.errors.length > 0 ? "error" : "idle");
    }, 120);
    return () => clearTimeout(handle);
  }, [nodes, edges]);

  return { ...result, status };
}
