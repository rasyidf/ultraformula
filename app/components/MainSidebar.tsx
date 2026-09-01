
"use client";
import { useState } from "react";

import { ChevronDown, DicesIcon, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { getFormula } from "~/lib/formulas";
import { ParameterControl } from "./ParameterControl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ColorPicker } from "./ui/color-picker";
import { ScrollArea } from "./ui/scroll-area";
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
    setActiveViewId,
    availableViews,
    activeView,
    setBackgroundColor,
    setEnvironmentPreset,
    setShowEnvironment,
    setEnableVertexColors,
  } = useSuperformulaContext();

  const metadata = getFormulaMetadata();

  const environmentPresets = [
    "sunset", "dawn", "night", "warehouse", "forest", "apartment",
    "studio", "city", "park", "lobby"
  ];

  const currentFormula = getFormula(formulaState.formulaType);
  const is3DView = activeView?.dimension === '3d';
  // Search/filter state
  // Collect all categories/tags from formulas
  const allCategories = Array.from(new Set(Object.values(formulas).flatMap(f => f.metadata.categories ?? [])));
  const allTags = Array.from(new Set(Object.values(formulas).flatMap(f => f.metadata.tags ?? [])));

  // Search/filter state and logic (must be after formulas)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (category ? 1 : 0) + (tag ? 1 : 0);

  // Filter formulas by search/category/tag
  const filteredFormulaKeys = Object.keys(formulas).filter(key => {
    const meta = formulas[key].metadata;
    const matchesSearch = search === "" || meta.name.toLowerCase().includes(search.toLowerCase()) || meta.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || category === "all" || (meta.categories && meta.categories.includes(category));
    const matchesTag = !tag || tag === "all" || (meta.tags && meta.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTag;
  });
  return (<>
    <SidebarHeader className="h-auto px-4 flex flex-col items-center gap-3">
      <div className="w-full space-y-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="formulaSearch"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search formulas"
            className="pl-8"
          />
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setCategory(""); setTag(""); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <CollapsibleContent className="pt-2">
            <div className="flex gap-2">
              <Select value={category || "all"} onValueChange={v => setCategory(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tag || "all"} onValueChange={v => setTag(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Formula</Label>
          <span className="text-xs text-muted-foreground">
            {filteredFormulaKeys.length} of {Object.keys(formulas).length}
          </span>
        </div>
        <ScrollArea className="h-72 w-full rounded-md border">
          <div className="divide-y">
            {filteredFormulaKeys.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No formulas match your filters.</p>
            )}
            {filteredFormulaKeys.map(key => {
              const meta = formulas[key].metadata;
              const isActive = key === formulaState.formulaType;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormulaType(key)}
                  aria-pressed={isActive}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium">{meta.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{meta.description}</div>
                  {meta.categories && meta.categories.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {meta.categories.slice(0, 3).map(c => (
                        <span
                          key={c}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {availableViews.length > 1 && (
        <div className="space-y-2 w-full">
          <Label htmlFor="renderMode">Render View</Label>
          <ToggleGroup
            type="single"
            value={activeView?.id}
            onValueChange={(value) => {
              if (value) setActiveViewId(value);
            }}
            className="w-full justify-center"
          >
            {availableViews.map((view) => {
              const Icon = view.icon;
              return (
                <ToggleGroupItem
                  key={view.id}
                  value={view.id}
                  aria-label={`Switch to ${view.label}`}
                  className="flex-1"
                >
                  {Icon && <Icon className="mr-1 h-4 w-4" />}
                  {view.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      )}
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
                    {is3DView && (
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

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="vertexColors"
                            checked={canvasSettings.enableVertexColors}
                            onCheckedChange={setEnableVertexColors}
                            disabled={!currentFormula.metadata.supportsVertexColors}
                          />
                          <Label htmlFor="vertexColors">Color-Coded Parts</Label>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="meshColor">{activeView?.dimension === '2d' ? 'Line Color' : 'Mesh Color'}</Label>
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

                    {is3DView && (
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
