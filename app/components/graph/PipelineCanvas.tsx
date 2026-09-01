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

  const decoratedNodes = useMemo(
    () =>
      nodes.map((n) =>
        errorNodeIds.has(n.id)
          ? { ...n, className: "pipeline-node-error" }
          : n,
      ),
    [nodes, errorNodeIds],
  );

  const isValidConnection = useCallback<IsValidConnection>(
    (edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (!source || !target) return false;
      const sdef = getNodeDefinition(source.data.nodeType);
      const tdef = getNodeDefinition(target.data.nodeType);
      if (!sdef || !tdef) return false;
      if (tdef.type === "output") return true; // Output accepts any value type
      const out = sdef.outputs.find((p) => p.id === edge.sourceHandle);
      const inp = tdef.inputs.find((p) => p.id === edge.targetHandle);
      return !!out && !!inp && out.type === inp.type;
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
      edges={edges}
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
      proOptions={{ hideAttribution: false }}
      defaultEdgeOptions={{ animated: true }}
      deleteKeyCode={["Backspace", "Delete"]}
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
