import { useEffect } from "react";
import { PipelineCanvas } from "~/components/graph/PipelineCanvas";
import type { NodeError } from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";

interface Props {
  errors: NodeError[];
}

export function GraphPanel({ errors }: Props) {
  const nodeCount = usePipelineStore((s) => s.nodes.length);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const duplicateNode = usePipelineStore((s) => s.duplicateNode);
  const removeNode = usePipelineStore((s) => s.removeNode);

  const errorNodeIds = new Set(errors.map((e) => e.nodeId).filter(Boolean));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!selectedNodeId) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNodeId, duplicateNode, removeNode]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Pipeline graph</span>
        <span>
          {nodeCount} nodes · drag from the library · ⌫ delete · ⌘D duplicate
        </span>
      </div>
      <div className="relative flex-1">
        <PipelineCanvas errorNodeIds={errorNodeIds} />
      </div>
    </div>
  );
}
