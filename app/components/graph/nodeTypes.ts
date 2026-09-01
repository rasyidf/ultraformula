import type { NodeCategory } from "~/lib/pipeline/types";
import { PipelineNode } from "./PipelineNode";

export const nodeTypes = { pipelineNode: PipelineNode };

export const CATEGORY_COLOR: Record<NodeCategory, string> = {
  Generator: "#3b82f6",
  Noise: "#8b5cf6",
  Modifier: "#f59e0b",
  Simulation: "#ef4444",
  Constraint: "#10b981",
  Output: "#64748b",
};
