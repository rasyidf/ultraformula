"use client";

import { FormulaProvider } from "@/contexts/FormulaContext";
import { CameraControls } from "./CameraControl";
import { FormulaCanvas } from "./FormulaCanvas";
import { MainSidebar } from "./MainSidebar";

export default function Superformula3D() {
  return (
    <FormulaProvider>
      <div className="w-full min-h-screen flex flex-col lg:flex-row p-4 gap-4">
        <MainSidebar />
        <div className="flex flex-col lg:w-3/4 gap-4">
          <FormulaCanvas />
        </div>
        <CameraControls />
      </div>
    </FormulaProvider>
  );
}


