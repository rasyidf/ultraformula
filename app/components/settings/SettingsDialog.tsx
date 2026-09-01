import { Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { ColorPicker } from "~/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { VIEWPORT_THEME_COLORS } from "~/lib/viewportColors";
import { useSceneStore } from "~/stores/sceneStore";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsDialog() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sync = useSceneStore((s) => s.syncColorsWithTheme);
  const backgroundColor = useSceneStore((s) => s.backgroundColor);
  const meshColor = useSceneStore((s) => s.meshColor);
  const outlineColor = useSceneStore((s) => s.outlineColor);
  const set = useSceneStore((s) => s.set);

  const previewPalette =
    VIEWPORT_THEME_COLORS[resolvedTheme === "light" ? "light" : "dark"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Theme and viewport colours in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Theme
            </Label>
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
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Viewport colours
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Match theme: light = white background, dark mesh · dark = dark
                  background, light mesh.
                </p>
              </div>
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
                <ColorRow
                  label="Background"
                  color={backgroundColor}
                  onChange={(c) => set({ backgroundColor: c })}
                />
                <ColorRow
                  label="Mesh / line"
                  color={meshColor}
                  onChange={(c) => set({ meshColor: c })}
                />
                <ColorRow
                  label="Outline"
                  color={outlineColor}
                  onChange={(c) => set({ outlineColor: c })}
                />
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border px-2 py-1.5">
      <span
        className="h-5 w-5 rounded border"
        style={{ background: color }}
      />
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
      <Input
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 text-xs"
      />
    </div>
  );
}
