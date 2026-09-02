import { SlidersHorizontal, Trash2 } from "lucide-react";
import { ParameterControl } from "~/components/ParameterControl";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import { isParamHandle, paramKeyFromHandle } from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useUiStore } from "~/stores/uiStore";
import type { Formula } from "~/types/Formula";

export function InspectorPanel({ formula }: { formula: Formula | null }) {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const node = usePipelineStore((s) =>
    s.nodes.find((n) => n.id === s.selectedNodeId),
  );
  const updateNodeParam = usePipelineStore((s) => s.updateNodeParam);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const linkedParamKey = usePipelineStore((s) =>
    s.edges
      .filter((e) => e.target === s.selectedNodeId && isParamHandle(e.targetHandle))
      .map((e) => paramKeyFromHandle(e.targetHandle as string))
      .sort()
      .join("|"),
  );
  const connectedInputKey = usePipelineStore((s) =>
    s.edges
      .filter(
        (e) => e.target === s.selectedNodeId && !isParamHandle(e.targetHandle),
      )
      .map((e) => e.targetHandle)
      .sort()
      .join("|"),
  );

  if (!(selectedNodeId && node)) {
    return <NoSelection formula={formula} />;
  }

  const def = getNodeDefinition(node.data.nodeType);
  const linked = new Set(linkedParamKey ? linkedParamKey.split("|") : []);
  const connectedInputs = new Set(
    connectedInputKey ? connectedInputKey.split("|") : [],
  );
  const inactive = new Set(def?.inactiveParams?.(connectedInputs) ?? []);
  const paramEntries = Object.entries(def?.params ?? {}).filter(
    ([key]) => !inactive.has(key),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {def?.label ?? node.data.nodeType}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {def?.category}
                {def?.group ? ` · ${def.group}` : ""}
              </div>
            </div>
            {node.data.nodeType !== "output" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeNode(node.id)}
                title="Delete node"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {def?.description && (
            <p className="text-xs text-muted-foreground">{def.description}</p>
          )}

          {def?.configFields?.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs">{field.label}</Label>
              <Textarea
                value={node.data.config[field.key] ?? field.default}
                onChange={(e) => updateNodeConfig(node.id, field.key, e.target.value)}
                rows={field.multiline ? 3 : 1}
                className="font-mono text-xs"
              />
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          <div className="space-y-4">
            {paramEntries.map(([key, meta]) => (
              <div key={key}>
                {linked.has(key) && (
                  <p className="mb-1 text-[10px] font-medium uppercase text-sky-500">
                    driven by an input socket
                  </p>
                )}
                <ParameterControl
                  paramKey={key}
                  metadata={meta}
                  value={node.data.params[key]}
                  isLocked={linked.has(key)}
                  onChange={(v) => updateNodeParam(node.id, key, v)}
                />
              </div>
            ))}
            {paramEntries.length === 0 && !def?.configFields && (
              <p className="text-xs text-muted-foreground">This node has no settings.</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function NoSelection({ formula }: { formula: Formula | null }) {
  const setUi = useUiStore((s) => s.set);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <SlidersHorizontal className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">
        Select a node in the graph to edit its parameters.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setUi({ settingsOpen: true, settingsTab: "viewport" })}
      >
        Viewport settings
      </Button>
      {!formula && (
        <p className="text-[11px] text-muted-foreground/70">
          Connect a node to the Output to see a render.
        </p>
      )}
    </div>
  );
}
