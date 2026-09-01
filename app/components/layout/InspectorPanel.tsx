import { Trash2 } from "lucide-react";
import { ParameterControl } from "~/components/ParameterControl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { getNodeDefinition } from "~/lib/pipeline/nodes";
import { resolveActiveView } from "~/lib/renderViews";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useSceneStore } from "~/stores/sceneStore";
import type { Formula } from "~/types/Formula";

const ENV_PRESETS = [
  "sunset", "dawn", "night", "warehouse", "forest",
  "apartment", "studio", "city", "park", "lobby",
];

export function InspectorPanel({ formula }: { formula: Formula | null }) {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const node = usePipelineStore((s) =>
    s.nodes.find((n) => n.id === s.selectedNodeId),
  );
  const updateNodeParam = usePipelineStore((s) => s.updateNodeParam);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);
  const removeNode = usePipelineStore((s) => s.removeNode);

  if (selectedNodeId && node) {
    const def = getNodeDefinition(node.data.nodeType);
    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{def?.label ?? node.data.nodeType}</div>
              <div className="text-[11px] text-muted-foreground">{def?.category}</div>
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
            {Object.entries(def?.params ?? {}).map(([key, meta]) => (
              <ParameterControl
                key={key}
                paramKey={key}
                metadata={meta}
                value={node.data.params[key]}
                onChange={(v) => updateNodeParam(node.id, key, v)}
              />
            ))}
            {def && Object.keys(def.params).length === 0 && !def.configFields && (
              <p className="text-xs text-muted-foreground">This node has no settings.</p>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return <SceneControls formula={formula} envPresets={ENV_PRESETS} />;
}

function SceneControls({
  formula,
  envPresets,
}: {
  formula: Formula | null;
  envPresets: string[];
}) {
  const s = useSceneStore();
  const activeView = formula ? resolveActiveView(formula, s.activeViewId) : null;
  const is3D = activeView?.dimension !== "2d";

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="pb-2 text-sm font-semibold">Scene settings</div>
        <p className="pb-3 text-[11px] text-muted-foreground">
          Select a node in the graph to edit its parameters.
        </p>

        <Accordion type="multiple" defaultValue={["camera", "scene", "material"]}>
          {is3D && (
            <AccordionItem value="camera">
              <AccordionTrigger className="text-xs">Camera &amp; lighting</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {(["x", "y", "z"] as const).map((axis, i) => (
                  <SliderRow
                    key={`cam-${axis}`}
                    label={`Camera ${axis.toUpperCase()}`}
                    min={-40}
                    max={40}
                    step={0.5}
                    value={s.cameraPosition[i]}
                    onChange={(v) => s.setCameraAxis(i as 0 | 1 | 2, v)}
                  />
                ))}
                <SliderRow
                  label="Ambient light"
                  min={0}
                  max={2}
                  step={0.05}
                  value={s.ambientLightIntensity}
                  onChange={(v) => s.set({ ambientLightIntensity: v })}
                />
                <SliderRow
                  label="Point light"
                  min={0}
                  max={3}
                  step={0.05}
                  value={s.pointLightIntensity}
                  onChange={(v) => s.set({ pointLightIntensity: v })}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="scene">
            <AccordionTrigger className="text-xs">Scene</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <SliderRow
                label="Scale"
                min={0.1}
                max={5}
                step={0.1}
                value={s.scale}
                onChange={(v) => s.set({ scale: v })}
              />
              <ToggleRow label="Show grid" checked={s.showGrid} onChange={(v) => s.set({ showGrid: v })} />
              <ToggleRow label="Show axes" checked={s.showAxes} onChange={(v) => s.set({ showAxes: v })} />
              {is3D && (
                <>
                  <ToggleRow label="Auto rotate" checked={s.autoRotate} onChange={(v) => s.set({ autoRotate: v })} />
                  <ToggleRow label="Shadows" checked={s.showShadows} onChange={(v) => s.set({ showShadows: v })} />
                  <ToggleRow label="Stats" checked={s.showStats} onChange={(v) => s.set({ showStats: v })} />
                  <ToggleRow
                    label="Environment"
                    checked={s.showEnvironment}
                    onChange={(v) => s.set({ showEnvironment: v })}
                  />
                  {s.showEnvironment && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Environment preset</Label>
                      <Select
                        value={s.environmentPreset}
                        onValueChange={(v) => s.set({ environmentPreset: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {envPresets.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p[0].toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {is3D && (
            <AccordionItem value="material">
              <AccordionTrigger className="text-xs">Material</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Material</Label>
                  <Select
                    value={s.materialType}
                    onValueChange={(v) => s.set({ materialType: v as typeof s.materialType })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="wobble">Wobble</SelectItem>
                      <SelectItem value="transmission">Transmission</SelectItem>
                      <SelectItem value="reflector">Reflector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ToggleRow label="Wireframe" checked={s.wireframe} onChange={(v) => s.set({ wireframe: v })} />
                <ToggleRow label="Float effect" checked={s.enableFloat} onChange={(v) => s.set({ enableFloat: v })} />
                <ToggleRow label="Outlines" checked={s.showOutlines} onChange={(v) => s.set({ showOutlines: v })} />
                <ToggleRow
                  label="Vertex colours"
                  checked={s.enableVertexColors}
                  onChange={(v) => s.set({ enableVertexColors: v })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Theme &amp; viewport colours live in Settings (top-right).
                </p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </ScrollArea>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <Label>{label}</Label>
        <span className="text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
