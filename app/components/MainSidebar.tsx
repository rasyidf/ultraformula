"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { DicesIcon } from "lucide-react";
import { ParameterControl } from "./ParameterControl";
import { Button } from "./ui/button";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./ui/sidebar";
import { ColorPicker } from "./ui/color-picker";


export function MainSidebar() {
  const {
    state,
    formulas,
    getFormulaMetadata,
    updateParam,
    toggleParamLock,
    randomizeParams,
    setFormulaType,
    setAutoRotate,
    setBackgroundColor,
    setMeshColor,
  } = useSuperformulaContext();

  const metadata = getFormulaMetadata();
  return (
    <>

      <SidebarHeader className="h-auto px-4 flex items-center">
        <h2 className="text-lg font-semibold">Ultraformula</h2>
        <div className="space-y-2 w-full">
          <Label htmlFor="formulaType">Formula Type</Label>
          <Select value={state.formulaType} onValueChange={setFormulaType}>
            <SelectTrigger id="formulaType">
              <SelectValue placeholder="Select formula type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(formulas).map(key => (
                <SelectItem key={key} value={key}>
                  {formulas[key].metadata.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="w-full p-4 h-auto lg:h-[calc(100vh-2rem)] overflow-y-auto ">

          <div className="flex justify-between">
            <Button onClick={randomizeParams}>
              <DicesIcon />
              Randomize Params</Button>
          </div>
          <div className="space-y-4">
            {Object.entries(metadata.parameters).map(([key, param]) => (
              <ParameterControl
                key={key}
                paramKey={key}
                metadata={param}
                value={state.params[key]}
                onChange={(v) => updateParam(key, v)}
                isLocked={state.lockedParams.has(key)}
                onToggleLock={() => toggleParamLock(key)}
              />
            ))}

            <div className="flex items-center space-x-2">
              <Switch id="autoRotate" checked={state.autoRotate} onCheckedChange={setAutoRotate} />
              <Label htmlFor="autoRotate">Auto Rotate</Label>
            </div>

          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="h-auto px-4 flex items-center">

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex items-center space-x-1">
            <ColorPicker color={state.backgroundColor} onChange={(e) => setBackgroundColor(e)} />
            <Input
              type="text"
              value={state.backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="flex-grow"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meshColor">Mesh Color</Label>
          <div className="flex items-center space-x-1">
            <ColorPicker color={state.meshColor} onChange={(e) => setMeshColor(e)} />

            <Input
              type="text"
              value={state.meshColor}
              onChange={(e) => setMeshColor(e.target.value)}
              className="flex-grow"
            />
          </div>
        </div>
        <span className="text-sm text-muted-foreground">v1.0.0</span>
      </SidebarFooter>
    </>

  );
}
