import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type IsValidConnection,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_COLOR, nodeTypes } from "~/components/graph/nodeTypes";
import { edgeInsertPlan } from "~/lib/pipeline/graphHelpers";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import { isParamHandle, PORT_COLORS, type PortType } from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";

interface Props {
  errorNodeIds: Set<string>;
}

function findEdgeAt(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const g = (el as Element).closest?.(".react-flow__edge");
    if (g) return g.getAttribute("data-id");
  }
  return null;
}

export function PipelineCanvas({ errorNodeIds }: Props) {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const onNodesChange = usePipelineStore((s) => s.onNodesChange);
  const onEdgesChange = usePipelineStore((s) => s.onEdgesChange);
  const onConnect = usePipelineStore((s) => s.onConnect);
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode);
  const addNode = usePipelineStore((s) => s.addNode);
  const insertNodeOnEdge = usePipelineStore((s) => s.insertNodeOnEdge);
  const draggingNodeType = usePipelineStore((s) => s.draggingNodeType);
  const setDraggingNodeType = usePipelineStore((s) => s.setDraggingNodeType);
  const { screenToFlowPosition } = useReactFlow();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const [insertEdgeId, setInsertEdgeId] = useState<string | null>(null);

  const draggingDef = draggingNodeType
    ? getNodeDefinition(draggingNodeType)
    : undefined;

  const miniMapNodeColor = useCallback((n: { data: unknown }) => {
    const def = getNodeDefinition((n.data as { nodeType: string }).nodeType);
    return def ? CATEGORY_COLOR[def.category] : "#64748b";
  }, []);

  const outputPortType = useCallback(
    (nodeId: string, handleId?: string | null): PortType | undefined => {
      const node = nodes.find((n) => n.id === nodeId);
      const def = node && getNodeDefinition(node.data.nodeType);
      return def?.outputs.find((p) => p.id === handleId)?.type;
    },
    [nodes],
  );

  const decoratedNodes = useMemo(
    () =>
      nodes.map((n) =>
        errorNodeIds.has(n.id) ? { ...n, className: "pipeline-node-error" } : n,
      ),
    [nodes, errorNodeIds],
  );

  const decoratedEdges = useMemo(
    () =>
      edges.map((e) => {
        const isParam = isParamHandle(e.targetHandle);
        const type: PortType = isParam
          ? "number"
          : outputPortType(e.source, e.sourceHandle) ?? "field";
        const stroke = PORT_COLORS[type];
        return {
          ...e,
          type: "default",
          animated: true,
          className: e.id === insertEdgeId ? "pipeline-edge-drop" : undefined,
          style: isParam
            ? { stroke, strokeWidth: 1.5, strokeDasharray: "4 3" }
            : { stroke, strokeWidth: 2 },
        };
      }),
    [edges, outputPortType, insertEdgeId],
  );

  const isValidConnection = useCallback<IsValidConnection>(
    (edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (!source || !target || source.id === target.id) return false;
      const sdef = getNodeDefinition(source.data.nodeType);
      const tdef = getNodeDefinition(target.data.nodeType);
      if (!sdef || !tdef) return false;
      const out = sdef.outputs.find((p) => p.id === edge.sourceHandle);
      if (!out) return false;
      if (isParamHandle(edge.targetHandle)) return out.type === "number";
      if (tdef.type === "output") return true;
      const inp = tdef.inputs.find((p) => p.id === edge.targetHandle);
      return !!inp && out.type === inp.type;
    },
    [nodes],
  );

  const clearDrag = useCallback(() => {
    setPreview(null);
    setInsertEdgeId(null);
  }, []);

  // Track the pointer for the floating preview + edge-insert highlight while a
  // library node is being dragged (anywhere on the page).
  useEffect(() => {
    if (!draggingNodeType) {
      clearDrag();
      return;
    }
    const onOver = (e: DragEvent) => {
      setPreview({ x: e.clientX, y: e.clientY });
      const edgeId = findEdgeAt(e.clientX, e.clientY);
      const edge = edgeId ? edges.find((ed) => ed.id === edgeId) : undefined;
      setInsertEdgeId(
        edge && edgeInsertPlan(draggingNodeType, edge, nodes) ? edgeId : null,
      );
    };
    window.addEventListener("dragover", onOver);
    return () => window.removeEventListener("dragover", onOver);
  }, [draggingNodeType, edges, nodes, clearDrag]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type =
        event.dataTransfer.getData("application/x-pipeline-node") ||
        draggingNodeType;
      clearDrag();
      setDraggingNodeType(null);
      if (!type) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      if (insertEdgeId && insertNodeOnEdge(type, insertEdgeId, position)) return;
      addNode(type, position);
    },
    [
      addNode,
      clearDrag,
      draggingNodeType,
      insertEdgeId,
      insertNodeOnEdge,
      screenToFlowPosition,
      setDraggingNodeType,
    ],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(c: Connection) => onConnect(c)}
        isValidConnection={isValidConnection}
        onSelectionChange={({ nodes: sel }) =>
          setSelectedNode(sel.length === 1 ? sel[0].id : null)
        }
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionRadius={30}
        connectionLineStyle={{ strokeWidth: 2, stroke: "var(--primary)" }}
        defaultEdgeOptions={{ type: "default", animated: true }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable nodeColor={miniMapNodeColor} />
      </ReactFlow>

      {draggingDef && preview && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-xl"
          style={{
            left: preview.x + 12,
            top: preview.y + 14,
            background: CATEGORY_COLOR[draggingDef.category],
          }}
        >
          {draggingDef.label}
          {insertEdgeId && (
            <span className="rounded bg-white/25 px-1 text-[10px] font-medium">
              insert
            </span>
          )}
        </div>
      )}
    </div>
  );
}
