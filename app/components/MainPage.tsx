"use client";

import { Download, Plus } from "lucide-react";
import { Suspense, useCallback } from "react";
import { FormulaProvider, useSuperformulaContext } from "~/contexts/FormulaContext";
import { useDialog } from "~/hooks/useDialog";
import { AppSidebar } from "./AppSidebar";
import { CameraControls } from "./CameraControl";
import { FormulaCanvasWrapper } from "./FormulaCanvasWrapper";
import { FormulaCreatorDialog } from "./FormulaCreatorDialog";
import { Button } from "./ui/button";
import { Loader } from "./ui/loader";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

function MainContent() {
  const dialog = useDialog();
  const {
    formulaState,
  } = useSuperformulaContext();

  // Function to export canvas as image
  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${formulaState.formulaType}-ultraformula-export.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  return (
    <div className="flex h-screen w-screen">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className="flex flex-col h-full gap-4 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <h1 className="text-2xl font-bold hidden sm:block">UltraFormula</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={dialog.open} variant="default" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Formula
                  </Button>
                </div>
              </div>

              <div className="relative flex-1">
                <Suspense fallback={<Loader className="absolute inset-0 flex items-center justify-center" />}>
                  <FormulaCanvasWrapper />
                </Suspense>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <CameraControls />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <FormulaCreatorDialog isOpen={dialog.isOpen} onClose={dialog.close} />
    </div>
  );
}

export default function Superformula3D() {
  return (
    <FormulaProvider>
      <SidebarProvider>
        <MainContent />
      </SidebarProvider>
    </FormulaProvider>
  );
}


