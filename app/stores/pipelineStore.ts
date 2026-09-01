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

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  setSelectedNode: (id: string | null) => void;
  addNode: (type: string, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  updateNodeParam: (id: string, key: string, value: number) => void;
  updateNodeConfig: (id: string, key: string, value: string) => void;
  toggleNodeExpanded: (id: string) => void;
  selectAllNodes: () => void;

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

      addNode: (type, position) => {
        const node = makeNode(
          type,
          position ?? { x: 120 + Math.random() * 240, y: 80 + Math.random() * 240 },
        );
        set({ nodes: [...get().nodes, node], selectedNodeId: node.id });
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
        // Backfill params/config that node definitions gained since last save.
        const nodes = (p.nodes ?? current.nodes).map((n) => ({
          ...n,
          data: {
            ...n.data,
            params: { ...defaultParams(n.data.nodeType), ...n.data.params },
            config: { ...defaultConfig(n.data.nodeType), ...n.data.config },
          },
        }));
        return { ...current, ...p, nodes, edges: p.edges ?? current.edges };
      },
    },
  ),
);
