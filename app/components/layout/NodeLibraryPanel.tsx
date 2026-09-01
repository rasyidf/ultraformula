import { GripVertical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY_COLOR } from "~/components/graph/nodeTypes";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { nodeDefinitions } from "~/lib/pipeline/nodes";
import type { NodeCategory, NodeDefinition } from "~/lib/pipeline/types";
import { usePipelineStore } from "~/stores/pipelineStore";

// 1x1 transparent gif — hides the native drag ghost so only the in-app
// floating preview (PipelineCanvas) shows.
let transparentImg: HTMLImageElement | undefined;
function getTransparentImg() {
  if (typeof Image === "undefined") return undefined;
  if (!transparentImg) {
    transparentImg = new Image();
    transparentImg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  return transparentImg;
}

const CATEGORY_ORDER: NodeCategory[] = [
  "Input",
  "Generator",
  "Noise",
  "Modifier",
  "Simulation",
  "Constraint",
  "Output",
];

export function NodeLibraryPanel() {
  const [search, setSearch] = useState("");
  const addNode = usePipelineStore((s) => s.addNode);
  const setDraggingNodeType = usePipelineStore((s) => s.setDraggingNodeType);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (d: NodeDefinition) =>
      !q ||
      d.label.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.tags?.some((t) => t.includes(q)) ||
      d.category.toLowerCase().includes(q);

    const map = new Map<NodeCategory, NodeDefinition[]>();
    for (const def of nodeDefinitions()) {
      if (!match(def)) continue;
      if (!map.has(def.category)) map.set(def.category, []);
      map.get(def.category)!.push(def);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [search]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-[calc(100vh-8rem)]">
        <div className="p-2">
          {grouped.map(({ category, items }) => (
            <div key={category} className="mb-3">
              <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </div>
              <div className="space-y-1">
                {items.map((def) => (
                  <button
                    key={def.type}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-pipeline-node",
                        def.type,
                      );
                      e.dataTransfer.effectAllowed = "move";
                      const img = getTransparentImg();
                      if (img) e.dataTransfer.setDragImage(img, 0, 0);
                      setDraggingNodeType(def.type);
                    }}
                    onDragEnd={() => setDraggingNodeType(null)}
                    onClick={() => addNode(def.type)}
                    title={def.description}
                    className="group flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-accent"
                  >
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: CATEGORY_COLOR[def.category] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium leading-tight">
                        {def.label}
                      </span>
                      {def.description && (
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {def.description}
                        </span>
                      )}
                    </span>
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No nodes match.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
