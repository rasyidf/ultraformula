import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { memo, useEffect } from "react";
import type { ParameterMetadata } from "~/types/Formula";
import type { PipelineNodeData } from "~/lib/pipeline/graphHelpers";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import {
  isParamHandle,
  PARAM_HANDLE_PREFIX,
  paramKeyFromHandle,
  PORT_COLORS,
  type PortType,
} from "~/lib/pipeline/types";
import { cn } from "~/lib/utils";
import { usePipelineStore } from "~/stores/pipelineStore";
import { CATEGORY_COLOR } from "./nodeTypes";

function portHandleStyle(
  type: PortType,
  side: "left" | "right",
  size = 11,
): React.CSSProperties {
  const style: React.CSSProperties = {
    top: "50%",
    transform: "translateY(-50%)",
    width: size,
    height: size,
    background: PORT_COLORS[type],
    border: "2px solid var(--card)",
  };
  style[side] = -(size / 2);
  return style;
}

function fmt(v: unknown) {
  return typeof v === "number"
    ? Number.isInteger(v)
      ? String(v)
      : v.toFixed(2)
    : String(v);
}

export const PipelineNode = memo(function PipelineNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as PipelineNodeData;
  const def = getNodeDefinition(nodeData.nodeType);
  const updateNodeInternals = useUpdateNodeInternals();
  const toggleExpanded = usePipelineStore((s) => s.toggleNodeExpanded);
  const updateNodeParam = usePipelineStore((s) => s.updateNodeParam);
  const linkedKey = usePipelineStore((s) =>
    s.edges
      .filter((e) => e.target === id && isParamHandle(e.targetHandle))
      .map((e) => paramKeyFromHandle(e.targetHandle as string))
      .sort()
      .join("|"),
  );

  const expanded = !!nodeData.expanded;

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, expanded, linkedKey, updateNodeInternals]);

  if (!def) {
    return (
      <div className="rounded-md border border-destructive bg-card px-3 py-2 text-xs text-destructive">
        Unknown node: {nodeData.nodeType}
      </div>
    );
  }

  const linked = new Set(linkedKey ? linkedKey.split("|") : []);
  const color = CATEGORY_COLOR[def.category];
  const params = Object.entries(def.params);
  const shownParams = expanded
    ? params
    : params.filter(([k]) => linked.has(k));
  const hiddenCount = params.length - shownParams.length;

  return (
    <div
      className={cn(
        "w-[232px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-md transition-shadow",
        selected
          ? "border-primary ring-2 ring-primary/60"
          : "border-border hover:shadow-lg",
      )}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-1 px-2.5 py-1.5 text-xs font-semibold text-white active:cursor-grabbing"
        style={{ background: color }}
        onDoubleClick={() => params.length > 0 && toggleExpanded(id)}
      >
        <span className="truncate">{def.label}</span>
        {params.length > 0 && (
          <button
            type="button"
            className="nodrag -m-0.5 rounded p-0.5 hover:bg-white/25"
            title={expanded ? "Collapse parameters" : "Show all parameters"}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(id);
            }}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      <div className="py-1.5">
        {def.inputs.map((port) => (
          <div
            key={port.id}
            className="relative flex items-center gap-2 px-3 py-1 text-[11px]"
          >
            <Handle
              id={port.id}
              type="target"
              position={Position.Left}
              style={portHandleStyle(port.type, "left")}
            />
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: PORT_COLORS[port.type] }}
            />
            <span className="text-muted-foreground">{port.label}</span>
          </div>
        ))}

        {def.outputs.map((port) => (
          <div
            key={port.id}
            className="relative flex items-center justify-end gap-2 px-3 py-1 text-[11px]"
          >
            <span className="font-medium">{port.label}</span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: PORT_COLORS[port.type] }}
            />
            <Handle
              id={port.id}
              type="source"
              position={Position.Right}
              style={portHandleStyle(port.type, "right")}
            />
          </div>
        ))}

        {(shownParams.length > 0 || hiddenCount > 0) && (
          <div className="mt-1 border-t pt-1">
            {shownParams.map(([key, meta]) => (
              <ParamRow
                key={key}
                paramKey={key}
                meta={meta}
                value={nodeData.params[key]}
                linked={linked.has(key)}
                onChange={(v) => updateNodeParam(id, key, v)}
              />
            ))}
            {!expanded && hiddenCount > 0 && (
              <button
                type="button"
                className="nodrag w-full px-3 py-0.5 text-left text-[10px] text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(id);
                }}
              >
                {shownParams.length > 0 ? "+ " : ""}
                {hiddenCount} more parameter{hiddenCount > 1 ? "s" : ""}…
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function ParamRow({
  paramKey,
  meta,
  value,
  linked,
  onChange,
}: {
  paramKey: string;
  meta: ParameterMetadata;
  value: number | undefined;
  linked: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center gap-1.5 px-3 py-[3px] text-[11px]">
      <Handle
        id={`${PARAM_HANDLE_PREFIX}${paramKey}`}
        type="target"
        position={Position.Left}
        style={portHandleStyle("number", "left", 9)}
      />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {meta.name}
      </span>
      {linked ? (
        <span className="rounded bg-sky-500/15 px-1 text-[9px] font-medium uppercase text-sky-500">
          linked
        </span>
      ) : (
        <ParamMiniControl meta={meta} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function ParamMiniControl({
  meta,
  value,
  onChange,
}: {
  meta: ParameterMetadata;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const v = value ?? meta.default ?? meta.min ?? 0;
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  if (meta.controlType === "select") {
    return (
      <select
        className="nodrag max-w-[110px] rounded border bg-background px-1 py-0.5 text-[10px]"
        value={String(v)}
        onPointerDown={stop}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {meta.choices?.map((c, i) => (
          <option key={c} value={c}>
            {meta.choiceLabels?.[i] ?? c}
          </option>
        ))}
      </select>
    );
  }

  if (meta.controlType === "toggle") {
    return (
      <input
        type="checkbox"
        className="nodrag accent-primary"
        checked={!!v}
        onPointerDown={stop}
        onChange={(e) => onChange(e.target.checked ? 1 : 0)}
      />
    );
  }

  return (
    <input
      type="number"
      className="nodrag w-16 rounded border bg-background px-1 py-0.5 text-right text-[10px] tabular-nums"
      value={v}
      min={meta.min}
      max={meta.max}
      step={meta.step ?? 0.01}
      onPointerDown={stop}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
