"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSuperformulaContext } from "@/contexts/FormulaContext";
import { DicesIcon } from "lucide-react";
import { ParameterControl } from "./ParameterControl";
import { Button } from "./ui/button";


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
    <Card className="w-full lg:w-1/4 h-auto lg:h-[calc(100vh-2rem)] overflow-y-auto">
      <CardHeader>
        <CardTitle>Ultraformula</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
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

        <div className="flex justify-between">
          <Button onClick={randomizeParams}>
            <DicesIcon />
            Randomize Params</Button>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="backgroundColor"
              type="color"
              value={state.backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-12 h-12 p-1 rounded"
            />
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
          <div className="flex items-center space-x-2">
            <Input
              id="meshColor"
              type="color"
              value={state.meshColor}
              onChange={(e) => setMeshColor(e.target.value)}
              className="w-12 h-12 p-1 rounded"
            />
            <Input
              type="text"
              value={state.meshColor}
              onChange={(e) => setMeshColor(e.target.value)}
              className="flex-grow"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
