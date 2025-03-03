"use client";

import { Cuboid as Cube, DicesIcon, SquareStackIcon } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { getFormula } from "~/lib/formulas";
import { ParameterControl } from "./ParameterControl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { ColorPicker } from "./ui/color-picker";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export function MainSidebar() {
  const {
    formulaState,
    formulas,
    getFormulaMetadata,
    updateParam,
    toggleParamLock,
    randomizeParams,
    setFormulaType,
    setMeshColor,
    setMaterialType,
    setWireframe,
    setFloatEffect,
    setOutlinesEnabled,
    setOutlineColor,

    // Canvas settings
    canvasSettings,
    setRenderMode,
    setBackgroundColor,
    setEnvironmentPreset,
    setShowEnvironment,
  } = useSuperformulaContext();

  const metadata = getFormulaMetadata();

  const environmentPresets = [
    "sunset", "dawn", "night", "warehouse", "forest", "apartment",
    "studio", "city", "park", "lobby"
  ];

  // Check if the current formula supports 2D rendering
  const currentFormula = getFormula(formulaState.formulaType);
  const supports2D = currentFormula.metadata.supportedDimensions.includes('2d');
  const supports3D = currentFormula.metadata.supportedDimensions.includes('3d');

  return (
    <>
      <SidebarHeader className="h-auto px-4 flex flex-col items-center gap-4">
        <div className="space-y-2 w-full">
          <Label htmlFor="formulaType">Formula Type</Label>
          <Select value={formulaState.formulaType} onValueChange={setFormulaType}>
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

        <div className="space-y-2 w-full">
          <Label htmlFor="renderMode">Render Mode</Label>
          <ToggleGroup
            type="single"
            value={canvasSettings.renderMode}
            onValueChange={(value) => {
              if (value) setRenderMode(value as '2d' | '3d');
            }}
            className="w-full justify-center"
          >
            <ToggleGroupItem
              value="2d"
              disabled={!supports2D}
              aria-label="Toggle 2D mode"
              className="flex-1"
            >
              <SquareStackIcon className="mr-1 h-4 w-4" />
              2D
            </ToggleGroupItem>
            <ToggleGroupItem
              value="3d"
              disabled={!supports3D}
              aria-label="Toggle 3D mode"
              className="flex-1"
            >
              <Cube className="mr-1 h-4 w-4" />
              3D
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="w-full p-4 h-auto lg:h-[calc(100vh-8rem)] overflow-y-auto">
          <Tabs defaultValue="parameters">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="parameters" className="flex-1">Parameters</TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters">
              <div className="flex justify-between mb-4">
                <Button onClick={randomizeParams}>
                  <DicesIcon className="mr-2 h-4 w-4" />
                  Randomize Params
                </Button>
              </div>
              <div className="space-y-4">
                {Object.entries(metadata.parameters).map(([key, param]) => (
                  <ParameterControl
                    key={key}
                    paramKey={key}
                    metadata={param}
                    value={formulaState.params[key]}
                    onChange={(v) => updateParam(key, v)}
                    isLocked={formulaState.lockedParams.has(key)}
                    onToggleLock={() => toggleParamLock(key)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <Accordion type="multiple" defaultValue={["materials", "background"]}>
                <AccordionItem value="materials">
                  <AccordionTrigger>Material Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {canvasSettings.renderMode === '3d' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="materialType">Material Type</Label>
                            <Select value={formulaState.materialType} onValueChange={setMaterialType}>
                              <SelectTrigger id="materialType">
                                <SelectValue placeholder="Select material type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="wobble">Wobble</SelectItem>
                                <SelectItem value="transmission">Transmission</SelectItem>
                                <SelectItem value="reflector">Reflector</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="wireframe"
                              checked={formulaState.wireframe}
                              onCheckedChange={setWireframe}
                            />
                            <Label htmlFor="wireframe">Wireframe</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="float"
                              checked={formulaState.enableFloat}
                              onCheckedChange={setFloatEffect}
                            />
                            <Label htmlFor="float">Float Effect</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="outlines"
                              checked={formulaState.showOutlines}
                              onCheckedChange={setOutlinesEnabled}
                            />
                            <Label htmlFor="outlines">Show Outlines</Label>
                          </div>

                          {formulaState.showOutlines && (
                            <div className="space-y-2">
                              <Label htmlFor="outlineColor">Outline Color</Label>
                              <div className="flex items-center space-x-1">
                                <ColorPicker color={formulaState.outlineColor} onChange={(e) => setOutlineColor(e)} />
                                <Input
                                  type="text"
                                  value={formulaState.outlineColor}
                                  onChange={(e) => setOutlineColor(e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="meshColor">{canvasSettings.renderMode === '2d' ? 'Line Color' : 'Mesh Color'}</Label>
                        <div className="flex items-center space-x-1">
                          <ColorPicker color={formulaState.meshColor} onChange={(e) => setMeshColor(e)} />
                          <Input
                            type="text"
                            value={formulaState.meshColor}
                            onChange={(e) => setMeshColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="background">
                  <AccordionTrigger>Background Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex items-center space-x-1">
                          <ColorPicker color={canvasSettings.backgroundColor} onChange={(e) => setBackgroundColor(e)} />
                          <Input
                            type="text"
                            value={canvasSettings.backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      {canvasSettings.renderMode === '3d' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="showEnvironment"
                              checked={canvasSettings.showEnvironment}
                              onCheckedChange={setShowEnvironment}
                            />
                            <Label htmlFor="showEnvironment">Show Environment</Label>
                          </div>

                          {canvasSettings.showEnvironment && (
                            <div className="space-y-2">
                              <Label htmlFor="environmentPreset">Environment Preset</Label>
                              <Select value={canvasSettings.environmentPreset} onValueChange={setEnvironmentPreset}>
                                <SelectTrigger id="environmentPreset">
                                  <SelectValue placeholder="Select environment preset" />
                                </SelectTrigger>
                                <SelectContent>
                                  {environmentPresets.map(preset => (
                                    <SelectItem key={preset} value={preset}>
                                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>


          </Tabs>
        </div>
      </SidebarContent>
      <SidebarFooter className="h-auto px-4 flex items-center">
        <span className="text-sm text-muted-foreground">Ultraformula v1.0.0</span>
      </SidebarFooter>
    </>
  );
}
