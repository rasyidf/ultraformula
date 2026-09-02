import {
  Download,
  Hexagon,
  PanelBottom,
  PanelLeft,
  PanelRight,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useRef } from "react";
import { toast } from "sonner";
import { SettingsDialog } from "~/components/settings/SettingsDialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { RFEdge, RFNode } from "~/lib/pipeline/graphHelpers";
import { pipelineSamples } from "~/lib/pipeline/samples";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useUiStore } from "~/stores/uiStore";

export function TopBar() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setGraph = usePipelineStore((s) => s.setGraph);
  const reset = usePipelineStore((s) => s.reset);
  const projectName = useUiStore((s) => s.projectName);
  const setUi = useUiStore((s) => s.set);
  const showLibrary = useUiStore((s) => s.showLibrary);
  const showGraph = useUiStore((s) => s.showGraph);
  const showInspector = useUiStore((s) => s.showInspector);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 2, projectName, nodes, edges }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, "-").toLowerCase() || "pipeline"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as {
        projectName?: string;
        nodes: RFNode[];
        edges: RFEdge[];
      };
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error("missing nodes/edges");
      }
      setGraph(parsed.nodes, parsed.edges);
      if (parsed.projectName) setUi({ projectName: parsed.projectName });
      toast.success("Pipeline imported");
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b px-3">
      <div className="flex items-center gap-2">
        <Hexagon className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">UltraFormula</span>
        <span className="text-muted-foreground">·</span>
        <Input
          value={projectName}
          onChange={(e) => setUi({ projectName: e.target.value })}
          aria-label="Project name"
          className="h-7 w-52 rounded-md border-transparent bg-transparent px-2 text-xs font-medium shadow-none transition-colors hover:bg-accent/60 focus-visible:bg-transparent"
        />
      </div>
      <div className="flex items-center gap-1">
        <div className="mr-1 flex items-center rounded-md border p-0.5">
          <PanelToggle
            label="Library panel  ( [ )"
            icon={PanelLeft}
            active={showLibrary}
            onClick={() => setUi({ showLibrary: !showLibrary })}
          />
          <PanelToggle
            label="Graph panel  ( \\ )"
            icon={PanelBottom}
            active={showGraph}
            onClick={() => setUi({ showGraph: !showGraph })}
          />
          <PanelToggle
            label="Inspector panel  ( ] )"
            icon={PanelRight}
            active={showInspector}
            onClick={() => setUi({ showInspector: !showInspector })}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Samples
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Load a sample pipeline</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[min(28rem,60vh)] overflow-y-auto overscroll-contain pr-0.5">
              {pipelineSamples.map((sample) => (
                <DropdownMenuItem
                  key={sample.id}
                  onSelect={() => {
                    const { nodes: n, edges: ed } = sample.build();
                    setGraph(n, ed);
                    setUi({ projectName: sample.name });
                    toast.success(`Loaded "${sample.name}"`);
                  }}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="text-xs font-medium">{sample.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {sample.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Import
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
        <SettingsDialog />
      </div>
    </header>
  );
}

function PanelToggle({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof PanelLeft;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-6 w-6",
        active ? "bg-accent text-foreground" : "text-muted-foreground",
      )}
      aria-pressed={active}
      title={`${active ? "Hide" : "Show"} ${label}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
