import { useReactFlow } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect } from "react";
import { PipelineCanvas } from "~/components/graph/PipelineCanvas";
import { Button } from "~/components/ui/button";
import { layoutGraph } from "~/lib/pipeline/autoLayout";
import { toGraphEdges } from "~/lib/pipeline/graphHelpers";
import type { NodeError } from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";

interface Props {
  errors: NodeError[];
}

export function GraphPanel({ errors }: Props) {
  const nodeCount = usePipelineStore((s) => s.nodes.length);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const duplicateNode = usePipelineStore((s) => s.duplicateNode);
  const selectAllNodes = usePipelineStore((s) => s.selectAllNodes);
  const setNodePositions = usePipelineStore((s) => s.setNodePositions);
  const { getNodes, fitView } = useReactFlow();

  const errorNodeIds = new Set(errors.map((e) => e.nodeId).filter(Boolean));

  const autoArrange = useCallback(() => {
    const { nodes, edges } = usePipelineStore.getState();
    const rfNodes = getNodes();
    const sizeOf = (id: string) => {
      const n = rfNodes.find((x) => x.id === id);
      return {
        width: n?.measured?.width ?? 240,
        height: n?.measured?.height ?? 120,
      };
    };
    const positions = layoutGraph(
      nodes.map((n) => ({ id: n.id })),
      toGraphEdges(edges),
      sizeOf,
      { originX: 40, originY: 40 },
    );
    setNodePositions(positions);
    window.setTimeout(() => fitView({ duration: 350, padding: 0.15 }), 60);
  }, [getNodes, fitView, setNodePositions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const editable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if (editable) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllNodes();
      } else if (mod && e.key.toLowerCase() === "d" && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      } else if (!mod && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        autoArrange();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNodeId, duplicateNode, selectAllNodes, autoArrange]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Pipeline graph</span>
          <span className="hidden md:inline">{nodeCount} nodes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden lg:inline">
            drop a node on a wire to insert · ⌘A select all · ⌫ delete
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={autoArrange}
            title="Auto-arrange nodes (Shift+L)"
          >
            <Sparkles className="mr-1 h-3 w-3" /> Tidy
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <PipelineCanvas errorNodeIds={errorNodeIds} />
      </div>
    </div>
  );
}
