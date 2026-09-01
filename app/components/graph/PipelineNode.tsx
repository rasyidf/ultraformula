import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import { PORT_COLORS, type PortSpec } from "~/lib/pipeline/types";
import type { PipelineNodeData } from "~/lib/pipeline/graphHelpers";
import { cn } from "~/lib/utils";
import { CATEGORY_COLOR } from "./nodeTypes";

const HANDLE_GAP = 20;
const HEADER_H = 34;

function portStyle(index: number, type: PortSpec["type"]) {
  return {
    top: HEADER_H + 14 + index * HANDLE_GAP,
    background: PORT_COLORS[type],
  };
}

function summarize(params: Record<string, number>, defParams: string[]) {
  return defParams
    .slice(0, 3)
    .map((k) => {
      const v = params[k];
      const s = typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(2)) : v;
      return `${k}: ${s}`;
    });
}

export const PipelineNode = memo(function PipelineNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as PipelineNodeData;
  const def = getNodeDefinition(nodeData.nodeType);
  if (!def) {
    return (
      <div className="rounded-md border border-destructive bg-card px-3 py-2 text-xs text-destructive">
        Unknown node: {nodeData.nodeType}
      </div>
    );
  }

  const color = CATEGORY_COLOR[def.category];
  const rows = Math.max(def.inputs.length, def.outputs.length, 1);
  const summary = summarize(nodeData.params, Object.keys(def.params));

  return (
    <div
      className={cn(
        "w-52 rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow",
        selected ? "ring-2 ring-primary" : "border-border",
      )}
      style={{ minHeight: HEADER_H + 16 + rows * HANDLE_GAP }}
    >
      <div
        className="flex items-center gap-2 rounded-t-lg px-3 text-xs font-semibold text-white"
        style={{ height: HEADER_H, background: color }}
      >
        <span className="truncate">{def.label}</span>
      </div>

      <div className="px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        {summary.length > 0 ? (
          summary.map((line) => (
            <div key={line} className="truncate">
              {line}
            </div>
          ))
        ) : (
          <div className="italic">{def.category}</div>
        )}
      </div>

      {def.inputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          style={portStyle(i, port.type)}
        />
      ))}
      {def.outputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={portStyle(i, port.type)}
        />
      ))}
    </div>
  );
});
