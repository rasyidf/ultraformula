"use client";

import { FormulaProvider } from "~/contexts/FormulaContext";
import { CameraControls } from "./CameraControl";
import { FormulaCanvas } from "./FormulaCanvas";
import { FormulaCreatorDialog } from "./FormulaCreatorDialog";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useDialog } from "~/hooks/useDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./ui/resizable";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function Superformula3D() {
  const dialog = useDialog();

  return (
    <FormulaProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">

          <ResizablePanelGroup direction="horizontal" className="w-full">
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full gap-4 p-4">

                <div className="flex justify-between">
                  <SidebarTrigger />
                  <Button onClick={dialog.open} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Formula
                  </Button>
                </div>
                <FormulaCanvas />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={10}>
              <div className="p-4">
                <CameraControls />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
        <FormulaCreatorDialog isOpen={dialog.isOpen} onClose={dialog.close} />
      </SidebarProvider>
    </FormulaProvider>
  );
}


