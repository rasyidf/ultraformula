import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function CameraControls() {
  const {
    canvasSettings,
    setScale,
    cameraSettings,
    setAmbientLightIntensity,
    setPointLightIntensity,
    setPointLightPosition,
    setCameraPosition,
    setShowAxes,
    setAutoRotate,
    setShowGrid,
    setShowStats,
    setShowShadows,
  } = useSuperformulaContext();

  const is3D = canvasSettings.renderMode === '3d';

  return (
    <div className="p-4 space-y-4">
      <Label>{is3D ? '3D Settings' : '2D Settings'}</Label>

      <Tabs defaultValue="camera">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="camera" className="flex-1">Camera</TabsTrigger>
          {is3D && <TabsTrigger value="lighting" className="flex-1">Lighting</TabsTrigger>}
          <TabsTrigger value="scene" className="flex-1">Scene</TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <Accordion type="multiple" className="w-full" defaultValue={["camera-position", "general"]}>
            {is3D && (
              <AccordionItem value="camera-position">
                <AccordionTrigger>Camera Position</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4">
                    {['x', 'y', 'z'].map((axis, i) => (
                      <div key={`camera-${axis}`} className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Camera {axis.toUpperCase()}</Label>
                          <span className="text-sm text-muted-foreground">
                            {cameraSettings.cameraPosition[i].toFixed(2)}
                          </span>
                        </div>
                        <Slider
                          min={-20}
                          max={20}
                          step={0.1}
                          value={[cameraSettings.cameraPosition[i]]}
                          onValueChange={([value]) => setCameraPosition(axis as 'x' | 'y' | 'z', value)}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="general">
              <AccordionTrigger>General</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Scale</Label>
                      <span className="text-sm text-muted-foreground">
                        {canvasSettings.scale.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Slider
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={[canvasSettings.scale]}
                        onValueChange={([value]) => setScale(value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={canvasSettings.scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {is3D && (
          <TabsContent value="lighting">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Ambient Light</Label>
                  <span className="text-sm text-muted-foreground">
                    {cameraSettings.ambientLightIntensity.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[cameraSettings.ambientLightIntensity]}
                  onValueChange={([value]) => setAmbientLightIntensity(value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Point Light Intensity</Label>
                  <span className="text-sm text-muted-foreground">
                    {cameraSettings.pointLightIntensity.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.1}
                  value={[cameraSettings.pointLightIntensity]}
                  onValueChange={([value]) => setPointLightIntensity(value)}
                />
              </div>

              {['x', 'y', 'z'].map((axis, i) => (
                <div key={`light-${axis}`} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Point Light {axis.toUpperCase()}</Label>
                    <span className="text-sm text-muted-foreground">
                      {cameraSettings.pointLightPosition[i].toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={-20}
                    max={20}
                    step={0.1}
                    value={[cameraSettings.pointLightPosition[i]]}
                    onValueChange={([value]) => setPointLightPosition(axis as 'x' | 'y' | 'z', value)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="scene">
          <div className="space-y-4">
            {is3D && (
              <div className="flex items-center space-x-2">
                <Switch id="autoRotate" checked={canvasSettings.autoRotate} onCheckedChange={setAutoRotate} />
                <Label htmlFor="autoRotate">Auto Rotate</Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch id="showGrid" checked={canvasSettings.showGrid} onCheckedChange={setShowGrid} />
              <Label htmlFor="showGrid">Show Grid</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="showAxes" checked={canvasSettings.showAxes} onCheckedChange={setShowAxes} />
              <Label htmlFor="showAxes">Show Axes</Label>
            </div>

            {is3D && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch id="showShadows" checked={canvasSettings.showShadows} onCheckedChange={setShowShadows} />
                  <Label htmlFor="showShadows">Show Shadows</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="showStats" checked={canvasSettings.showStats} onCheckedChange={setShowStats} />
                  <Label htmlFor="showStats">Show Stats</Label>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}