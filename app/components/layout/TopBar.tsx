import { Download, Hexagon, RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "~/components/theme/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { RFEdge, RFNode } from "~/lib/pipeline/graphHelpers";
import { usePipelineStore } from "~/stores/pipelineStore";
import { useUiStore } from "~/stores/uiStore";

export function TopBar() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setGraph = usePipelineStore((s) => s.setGraph);
  const reset = usePipelineStore((s) => s.reset);
  const projectName = useUiStore((s) => s.projectName);
  const setUi = useUiStore((s) => s.set);
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
          className="h-7 w-48 border-transparent bg-transparent px-1 text-xs hover:border-border focus:border-border"
        />
      </div>
      <div className="flex items-center gap-1">
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
        <ThemeToggle />
      </div>
    </header>
  );
}
