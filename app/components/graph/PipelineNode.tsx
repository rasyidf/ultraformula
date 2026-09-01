import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
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

const HANDLE_BASE =
  "!static !transform-none !translate-x-0 !translate-y-0 !min-w-0";

function dotStyle(type: PortType) {
  return { background: PORT_COLORS[type], border: "2px solid var(--card)" };
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

  return (
    <div
      className={cn(
        "w-60 rounded-lg border bg-card text-card-foreground shadow-sm",
        selected ? "border-primary ring-2 ring-primary" : "border-border",
      )}
    >
      <div
        className="flex items-center justify-between gap-1 rounded-t-lg px-2 py-1 text-xs font-semibold text-white"
        style={{ background: color }}
      >
        <span className="truncate">{def.label}</span>
        {params.length > 0 && (
          <button
            type="button"
            className="nodrag rounded p-0.5 hover:bg-white/20"
            title={expanded ? "Collapse parameters" : "Expand parameters"}
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
            className="flex items-center gap-1.5 px-2 py-1 text-[11px]"
          >
            <Handle
              id={port.id}
              type="target"
              position={Position.Left}
              className={cn(HANDLE_BASE, "!h-2.5 !w-2.5")}
              style={dotStyle(port.type)}
            />
            <span>{port.label}</span>
          </div>
        ))}

        {def.outputs.map((port) => (
          <div
            key={port.id}
            className="flex items-center justify-end gap-1.5 px-2 py-1 text-[11px]"
          >
            <span>{port.label}</span>
            <Handle
              id={port.id}
              type="source"
              position={Position.Right}
              className={cn(HANDLE_BASE, "!h-2.5 !w-2.5")}
              style={dotStyle(port.type)}
            />
          </div>
        ))}

        {params.length > 0 &&
          (expanded ? (
            <div className="mt-1 space-y-0.5 border-t pt-1">
              {params.map(([key, meta]) => (
                <ParamRow
                  key={key}
                  paramKey={key}
                  meta={meta}
                  value={nodeData.params[key]}
                  linked={linked.has(key)}
                  onChange={(v) => updateNodeParam(id, key, v)}
                />
              ))}
            </div>
          ) : (
            <>
              {params
                .filter(([key]) => linked.has(key))
                .map(([key, meta]) => (
                  <ParamRow
                    key={key}
                    paramKey={key}
                    meta={meta}
                    value={nodeData.params[key]}
                    linked
                    onChange={() => {}}
                  />
                ))}
              <div className="px-2 pt-0.5 text-[10px] text-muted-foreground">
                {params
                  .filter(([k]) => !linked.has(k))
                  .slice(0, 3)
                  .map(([k]) => (
                    <div key={k} className="truncate">
                      {k}: {fmt(nodeData.params[k])}
                    </div>
                  ))}
              </div>
            </>
          ))}
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
    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px]">
      <Handle
        id={`${PARAM_HANDLE_PREFIX}${paramKey}`}
        type="target"
        position={Position.Left}
        className={cn(HANDLE_BASE, "!h-2 !w-2")}
        style={dotStyle("number")}
      />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {meta.name}
      </span>
      {linked ? (
        <span className="rounded bg-muted px-1 text-[9px] uppercase text-muted-foreground">
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
        className="nodrag w-24 rounded border bg-background px-1 py-0.5 text-[10px]"
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
        className="nodrag"
        checked={!!v}
        onPointerDown={stop}
        onChange={(e) => onChange(e.target.checked ? 1 : 0)}
      />
    );
  }

  return (
    <input
      type="number"
      className="nodrag w-16 rounded border bg-background px-1 py-0.5 text-right text-[10px]"
      value={v}
      min={meta.min}
      max={meta.max}
      step={meta.step ?? 0.01}
      onPointerDown={stop}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
