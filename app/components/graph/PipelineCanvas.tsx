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
import { useCallback, useMemo } from "react";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import {
  isParamHandle,
  PORT_COLORS,
  type PortType,
} from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";
import { CATEGORY_COLOR, nodeTypes } from "./nodeTypes";

interface Props {
  errorNodeIds: Set<string>;
}

export function PipelineCanvas({ errorNodeIds }: Props) {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const onNodesChange = usePipelineStore((s) => s.onNodesChange);
  const onEdgesChange = usePipelineStore((s) => s.onEdgesChange);
  const onConnect = usePipelineStore((s) => s.onConnect);
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode);
  const addNode = usePipelineStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

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
          style: isParam
            ? { stroke, strokeWidth: 1.5, strokeDasharray: "4 3" }
            : { stroke, strokeWidth: 2 },
        };
      }),
    [edges, outputPortType],
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
      if (tdef.type === "output") return out.type !== "number";
      const inp = tdef.inputs.find((p) => p.id === edge.targetHandle);
      return !!inp && out.type === inp.type;
    },
    [nodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/x-pipeline-node");
      if (!type) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(type, position);
    },
    [addNode, screenToFlowPosition],
  );

  return (
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
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      fitView
      minZoom={0.2}
      maxZoom={2.5}
      deleteKeyCode={["Backspace", "Delete"]}
      connectionRadius={28}
      connectionLineStyle={{ strokeWidth: 2, stroke: "var(--primary)" }}
      defaultEdgeOptions={{ type: "default", animated: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <Controls />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => {
          const def = getNodeDefinition(
            (n.data as { nodeType: string }).nodeType,
          );
          return def ? CATEGORY_COLOR[def.category] : "#64748b";
        }}
      />
    </ReactFlow>
  );
}
