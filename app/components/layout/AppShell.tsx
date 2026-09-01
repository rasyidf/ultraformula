import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useRef } from "react";
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

function Shell() {
  const { formula, errors, status } = useGraphEvaluation();
  const ui = useUiStore();
  const lastErrorKey = useRef("");

  useEffect(() => {
    const key = errors.map((e) => `${e.nodeId}:${e.message}`).join("|");
    if (key && key !== lastErrorKey.current && !formula) {
      toast.error(errors[0].message);
    }
    lastErrorKey.current = key;
  }, [errors, formula]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={ui.libraryPanelSize}
          minSize={12}
          maxSize={30}
          onResize={(size) => useUiStore.setState({ libraryPanelSize: size })}
        >
          <NodeLibraryPanel />
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel minSize={20}>
              <ViewportPanel formula={formula} status={status} errors={errors} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={ui.graphDockSize}
              minSize={15}
              collapsible
              collapsedSize={0}
              onResize={(size) => useUiStore.setState({ graphDockSize: size })}
            >
              <GraphPanel errors={errors} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize={ui.inspectorPanelSize}
          minSize={16}
          maxSize={38}
          onResize={(size) => useUiStore.setState({ inspectorPanelSize: size })}
        >
          <InspectorPanel formula={formula} />
        </ResizablePanel>
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
