import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useGraphEvaluation } from "~/lib/pipeline/useGraphEvaluation";
import { useUiStore } from "~/stores/uiStore";
import { GraphPanel } from "./GraphPanel";
import { InspectorPanel } from "./InspectorPanel";
import { NodeLibraryPanel } from "./NodeLibraryPanel";
import { TopBar } from "./TopBar";
import { ViewportPanel } from "./ViewportPanel";

/** Persist a panel size at most once per 250ms of dragging. */
function useDebouncedSize(key: "libraryPanelSize" | "inspectorPanelSize" | "graphDockSize") {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (size: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        useUiStore.getState().set({ [key]: size });
      }, 250);
    },
    [key],
  );
}

function Shell() {
  const { formula, errors, status } = useGraphEvaluation();

  const showLibrary = useUiStore((s) => s.showLibrary);
  const showGraph = useUiStore((s) => s.showGraph);
  const showInspector = useUiStore((s) => s.showInspector);
  const libraryPanelSize = useUiStore((s) => s.libraryPanelSize);
  const inspectorPanelSize = useUiStore((s) => s.inspectorPanelSize);
  const graphDockSize = useUiStore((s) => s.graphDockSize);

  const persistLibrary = useDebouncedSize("libraryPanelSize");
  const persistInspector = useDebouncedSize("inspectorPanelSize");
  const persistGraph = useDebouncedSize("graphDockSize");

  const lastErrorKey = useRef("");
  useEffect(() => {
    const key = errors.map((e) => `${e.nodeId}:${e.message}`).join("|");
    if (key && key !== lastErrorKey.current && !formula) {
      toast.error(errors[0].message);
    }
    lastErrorKey.current = key;
  }, [errors, formula]);

  // Panel toggle shortcuts: [ library · ] inspector · \ graph
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      if (e.key === "[") useUiStore.setState((s) => ({ showLibrary: !s.showLibrary }));
      else if (e.key === "]") useUiStore.setState((s) => ({ showInspector: !s.showInspector }));
      else if (e.key === "\\") useUiStore.setState((s) => ({ showGraph: !s.showGraph }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <ResizablePanelGroup id="shell" direction="horizontal" className="flex-1">
        {showLibrary && (
          <>
            <ResizablePanel
              id="library"
              order={1}
              defaultSize={libraryPanelSize}
              minSize={12}
              maxSize={30}
              onResize={persistLibrary}
            >
              <NodeLibraryPanel />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel id="center" order={2} minSize={30}>
          <ResizablePanelGroup id="center-stack" direction="vertical">
            <ResizablePanel id="viewport" order={1} minSize={20}>
              <ViewportPanel formula={formula} status={status} errors={errors} />
            </ResizablePanel>
            {showGraph && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="graph"
                  order={2}
                  defaultSize={graphDockSize}
                  minSize={15}
                  onResize={persistGraph}
                >
                  <GraphPanel errors={errors} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>

        {showInspector && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="inspector"
              order={3}
              defaultSize={inspectorPanelSize}
              minSize={16}
              maxSize={38}
              onResize={persistInspector}
            >
              <InspectorPanel formula={formula} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export default function AppShell() {
  return (
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>
  );
}
