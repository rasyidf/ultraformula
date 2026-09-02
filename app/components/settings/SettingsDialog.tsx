import { Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import { ColorPicker } from "~/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { VIEWPORT_THEME_COLORS } from "~/lib/viewportColors";
import { useSceneStore } from "~/stores/sceneStore";
import { useUiStore } from "~/stores/uiStore";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const ENV_PRESETS = [
  "sunset", "dawn", "night", "warehouse", "forest",
  "apartment", "studio", "city", "park", "lobby",
];

export function SettingsDialog() {
  const open = useUiStore((s) => s.settingsOpen);
  const tab = useUiStore((s) => s.settingsTab);
  const setUi = useUiStore((s) => s.set);

  return (
    <Dialog open={open} onOpenChange={(o) => setUi({ settingsOpen: o })}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setUi({ settingsTab: v })}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="mx-5 mt-3 self-start">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="viewport">Viewport</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 p-5">
              <TabsContent value="appearance" className="mt-0 space-y-6">
                <AppearanceTab />
              </TabsContent>
              <TabsContent value="viewport" className="mt-0 space-y-6">
                <ViewportTab envPresets={ENV_PRESETS} />
              </TabsContent>
              <TabsContent value="performance" className="mt-0 space-y-6">
                <PerformanceTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { sync, backgroundColor, meshColor, outlineColor, set } = useSceneStore(
    useShallow((s) => ({
      sync: s.syncColorsWithTheme,
      backgroundColor: s.backgroundColor,
      meshColor: s.meshColor,
      outlineColor: s.outlineColor,
      set: s.set,
    })),
  );

  const previewPalette =
    VIEWPORT_THEME_COLORS[resolvedTheme === "light" ? "light" : "dark"];

  return (
    <>
      <Section title="Theme">
        <ToggleGroup
          type="single"
          value={mounted ? theme : undefined}
          onValueChange={(v) => v && setTheme(v)}
          className="w-full"
        >
          {THEME_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1">
              <opt.icon className="mr-1.5 h-4 w-4" />
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>

      <Section title="Viewport colours">
        <div className="flex items-start justify-between">
          <p className="max-w-xs text-[11px] text-muted-foreground">
            Match theme: light = white background + dark mesh · dark = dark
            background + light mesh.
          </p>
          <Switch
            checked={sync}
            onCheckedChange={(v) => set({ syncColorsWithTheme: v })}
          />
        </div>
        {sync ? (
          <div className="flex gap-2">
            <Swatch label="Background" color={previewPalette.background} />
            <Swatch label="Mesh / line" color={previewPalette.mesh} />
          </div>
        ) : (
          <div className="space-y-2">
            <ColorRow label="Background" color={backgroundColor} onChange={(c) => set({ backgroundColor: c })} />
            <ColorRow label="Mesh / line" color={meshColor} onChange={(c) => set({ meshColor: c })} />
            <ColorRow label="Outline" color={outlineColor} onChange={(c) => set({ outlineColor: c })} />
          </div>
        )}
      </Section>
    </>
  );
}

function ViewportTab({ envPresets }: { envPresets: string[] }) {
  const s = useSceneStore(
    useShallow((st) => ({
      cameraPosition: st.cameraPosition,
      ambientLightIntensity: st.ambientLightIntensity,
      pointLightIntensity: st.pointLightIntensity,
      scale: st.scale,
      showGrid: st.showGrid,
      showAxes: st.showAxes,
      autoRotate: st.autoRotate,
      showShadows: st.showShadows,
      showStats: st.showStats,
      showEnvironment: st.showEnvironment,
      environmentPreset: st.environmentPreset,
      materialType: st.materialType,
      wireframe: st.wireframe,
      enableFloat: st.enableFloat,
      showOutlines: st.showOutlines,
      enableVertexColors: st.enableVertexColors,
      set: st.set,
      setCameraAxis: st.setCameraAxis,
    })),
  );
  const showViewThumbnails = useUiStore((u) => u.showViewThumbnails);
  const setUi = useUiStore((u) => u.set);

  return (
    <>
      <Section title="Camera & lighting">
        {(["X", "Y", "Z"] as const).map((axis, i) => (
          <SliderRow
            key={axis}
            label={`Camera ${axis}`}
            min={-40}
            max={40}
            step={0.5}
            value={s.cameraPosition[i]}
            onChange={(v) => s.setCameraAxis(i as 0 | 1 | 2, v)}
          />
        ))}
        <SliderRow label="Ambient light" min={0} max={2} step={0.05} value={s.ambientLightIntensity} onChange={(v) => s.set({ ambientLightIntensity: v })} />
        <SliderRow label="Point light" min={0} max={3} step={0.05} value={s.pointLightIntensity} onChange={(v) => s.set({ pointLightIntensity: v })} />
      </Section>

      <Section title="Scene">
        <SliderRow label="Scale" min={0.1} max={5} step={0.1} value={s.scale} onChange={(v) => s.set({ scale: v })} />
        <ToggleRow label="View thumbnails" checked={showViewThumbnails} onChange={(v) => setUi({ showViewThumbnails: v })} />
        <ToggleRow label="Show grid" checked={s.showGrid} onChange={(v) => s.set({ showGrid: v })} />
        <ToggleRow label="Show axes" checked={s.showAxes} onChange={(v) => s.set({ showAxes: v })} />
        <ToggleRow label="Auto rotate" checked={s.autoRotate} onChange={(v) => s.set({ autoRotate: v })} />
        <ToggleRow label="Shadows" checked={s.showShadows} onChange={(v) => s.set({ showShadows: v })} />
        <ToggleRow label="Stats" checked={s.showStats} onChange={(v) => s.set({ showStats: v })} />
        <ToggleRow label="Environment" checked={s.showEnvironment} onChange={(v) => s.set({ showEnvironment: v })} />
        {s.showEnvironment && (
          <div className="space-y-1.5">
            <Label className="text-xs">Environment preset</Label>
            <Select value={s.environmentPreset} onValueChange={(v) => s.set({ environmentPreset: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {envPresets.map((p) => (
                  <SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Section>

      <Section title="Material">
        <div className="space-y-1.5">
          <Label className="text-xs">Material</Label>
          <Select value={s.materialType} onValueChange={(v) => s.set({ materialType: v as typeof s.materialType })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        <ToggleRow label="Vertex colours" checked={s.enableVertexColors} onChange={(v) => s.set({ enableVertexColors: v })} />
      </Section>
    </>
  );
}

function PerformanceTab() {
  const { adaptiveDpr, simResolutionCap, set } = useSceneStore(
    useShallow((s) => ({
      adaptiveDpr: s.adaptiveDpr,
      simResolutionCap: s.simResolutionCap,
      set: s.set,
    })),
  );
  const { evalDebounceMs, evalPaused, setUi } = useUiStore(
    useShallow((u) => ({
      evalDebounceMs: u.evalDebounceMs,
      evalPaused: u.evalPaused,
      setUi: u.set,
    })),
  );

  return (
    <>
      <Section title="Evaluation">
        <ToggleRow
          label="Pause evaluation"
          checked={evalPaused}
          onChange={(v) => setUi({ evalPaused: v })}
        />
        <SliderRow
          label="Debounce"
          unit="ms"
          min={0}
          max={500}
          step={10}
          value={evalDebounceMs}
          onChange={(v) => setUi({ evalDebounceMs: v })}
        />
        <p className="text-[11px] text-muted-foreground">
          Longer debounce = fewer re-evaluations while dragging sliders.
        </p>
      </Section>

      <Section title="Simulation">
        <SliderRow
          label="Resolution cap"
          min={64}
          max={256}
          step={8}
          value={simResolutionCap}
          onChange={(v) => set({ simResolutionCap: v })}
        />
        <p className="text-[11px] text-muted-foreground">
          Caps Heightmap / erosion grid size so the sim can't hitch the main
          thread on a laptop.
        </p>
      </Section>

      <Section title="Rendering">
        <ToggleRow
          label="Adaptive resolution (3D)"
          checked={adaptiveDpr}
          onChange={(v) => set({ adaptiveDpr: v })}
        />
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Label>
      {children}
    </section>
  );
}

function SliderRow({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit?: string;
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
        <span className="text-muted-foreground tabular-nums">
          {step >= 1 ? value.toFixed(0) : value.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
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

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border px-2 py-1.5">
      <span className="h-5 w-5 rounded border" style={{ background: color }} />
      <span className="text-xs">
        {label}
        <span className="block text-[10px] text-muted-foreground">{color}</span>
      </span>
    </div>
  );
}

function ColorRow({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 text-xs">{label}</Label>
      <ColorPicker color={color} onChange={onChange} />
      <Input value={color} onChange={(e) => onChange(e.target.value)} className="h-8 flex-1 text-xs" />
    </div>
  );
}
