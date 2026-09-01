import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearEvalCache } from "~/lib/pipeline/evaluate";
import {
  defaultConfig,
  defaultParams,
  edgeInsertPlan,
  makeNode,
  nextId,
  seedGraph,
  type RFEdge,
  type RFNode,
} from "~/lib/pipeline/graphHelpers";

export interface PipelineState {
  nodes: RFNode[];
  edges: RFEdge[];
  selectedNodeId: string | null;
  /** node type currently being dragged from the library (transient) */
  draggingNodeType: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  setSelectedNode: (id: string | null) => void;
  setDraggingNodeType: (type: string | null) => void;
  addNode: (type: string, position?: { x: number; y: number }) => void;
  insertNodeOnEdge: (
    type: string,
    edgeId: string,
    position: { x: number; y: number },
  ) => boolean;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  updateNodeParam: (id: string, key: string, value: number) => void;
  updateNodeConfig: (id: string, key: string, value: string) => void;
  toggleNodeExpanded: (id: string) => void;
  selectAllNodes: () => void;
  setNodePositions: (positions: Map<string, { x: number; y: number }>) => void;

  setGraph: (nodes: RFNode[], edges: RFEdge[]) => void;
  reset: () => void;
}

const seeded = seedGraph();

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      nodes: seeded.nodes,
      edges: seeded.edges,
      selectedNodeId: null,
      draggingNodeType: null,

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as RFNode[] });
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },
      onConnect: (connection) => {
        // One wire per target handle: drop any existing edge into that port.
        const filtered = get().edges.filter(
          (e) =>
            !(
              e.target === connection.target &&
              e.targetHandle === connection.targetHandle
            ),
        );
        set({ edges: addEdge(connection, filtered) });
      },

      setSelectedNode: (id) => set({ selectedNodeId: id }),
      setDraggingNodeType: (type) => set({ draggingNodeType: type }),

      addNode: (type, position) => {
        const node = makeNode(
          type,
          position ?? { x: 120 + Math.random() * 240, y: 80 + Math.random() * 240 },
        );
        set({ nodes: [...get().nodes, node], selectedNodeId: node.id });
      },

      insertNodeOnEdge: (type, edgeId, position) => {
        const edge = get().edges.find((e) => e.id === edgeId);
        if (!edge) return false;
        const plan = edgeInsertPlan(type, edge, get().nodes);
        if (!plan) return false;
        const node = makeNode(type, position);
        set({
          nodes: [...get().nodes, node],
          edges: [
            ...get().edges.filter((e) => e.id !== edgeId),
            {
              id: nextId("e"),
              source: edge.source,
              sourceHandle: edge.sourceHandle,
              target: node.id,
              targetHandle: plan.inHandle,
            },
            {
              id: nextId("e"),
              source: node.id,
              sourceHandle: plan.outHandle,
              target: edge.target,
              targetHandle: edge.targetHandle,
            },
          ],
          selectedNodeId: node.id,
        });
        return true;
      },

      removeNode: (id) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
        });
      },

      duplicateNode: (id) => {
        const src = get().nodes.find((n) => n.id === id);
        if (!src) return;
        const clone: RFNode = {
          ...src,
          id: nextId(),
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          selected: false,
          data: {
            ...src.data,
            params: { ...src.data.params },
            config: { ...src.data.config },
          },
        };
        set({ nodes: [...get().nodes, clone], selectedNodeId: clone.id });
      },

      updateNodeParam: (id, key, value) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, params: { ...n.data.params, [key]: value } } }
              : n,
          ),
        });
      },

      updateNodeConfig: (id, key, value) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
              : n,
          ),
        });
      },

      toggleNodeExpanded: (id) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, expanded: !n.data.expanded } }
              : n,
          ),
        });
      },

      selectAllNodes: () => {
        set({
          nodes: get().nodes.map((n) => ({ ...n, selected: true })),
          selectedNodeId: null,
        });
      },

      setNodePositions: (positions) => {
        set({
          nodes: get().nodes.map((n) =>
            positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n,
          ),
        });
      },

      setGraph: (nodes, edges) => {
        clearEvalCache();
        set({ nodes, edges, selectedNodeId: null });
      },

      reset: () => {
        clearEvalCache();
        const fresh = seedGraph();
        set({ nodes: fresh.nodes, edges: fresh.edges, selectedNodeId: null });
      },
    }),
    {
      name: "ultraformula.pipeline.v2",
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PipelineState>;
        // Migrate renamed node types.
        const RENAMES: Record<string, string> = { meshify: "colorize" };
        const nodes = (p.nodes ?? current.nodes).map((n) => {
          const nodeType = RENAMES[n.data.nodeType] ?? n.data.nodeType;
          return {
            ...n,
            data: {
              ...n.data,
              nodeType,
              params: { ...defaultParams(nodeType), ...n.data.params },
              config: { ...defaultConfig(nodeType), ...n.data.config },
            },
          };
        });
        return { ...current, ...p, nodes, edges: p.edges ?? current.edges };
      },
    },
  ),
);
