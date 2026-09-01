import type { NodeCategory } from "~/lib/pipeline/types";
import { PipelineNode } from "./PipelineNode";

export const nodeTypes = { pipelineNode: PipelineNode };

export const CATEGORY_COLOR: Record<NodeCategory, string> = {
  Input: "#0ea5e9",
  Generator: "#3b82f6",
  Noise: "#8b5cf6",
  Modifier: "#f59e0b",
  Simulation: "#ef4444",
  Output: "#64748b",
};
