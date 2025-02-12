import { useSuperformulaContext } from "@/contexts/FormulaContext";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

export function CameraControls() {
  const {
    state,
    setScale,
    setAmbientLightIntensity,
    setPointLightIntensity,
    setPointLightPosition,
    setCameraPosition,
    showAxes,
    setShowAxes,
  } = useSuperformulaContext();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Canvas Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Scale</Label>
            <Slider
              min={0.1}
              max={5}
              step={0.1}
              value={[state.scale]}
              onValueChange={([value]) => setScale(value)}
            />
            <Input
              type="number"
              value={state.scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Ambient Light</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[state.ambientLightIntensity]}
              onValueChange={([value]) => setAmbientLightIntensity(value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Point Light</Label>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[state.pointLightIntensity]}
              onValueChange={([value]) => setPointLightIntensity(value)}
            />
          </div>

          {['x', 'y', 'z'].map((axis, i) => (
            <div key={`light-${axis}`} className="space-y-2">
              <Label>Point Light {axis.toUpperCase()}</Label>
              <Slider
                min={-20}
                max={20}
                value={[state.pointLightPosition[i]]}
                onValueChange={([value]) => setPointLightPosition(axis as 'x' | 'y' | 'z', value)}
              />
            </div>
          ))}

          {['x', 'y', 'z'].map((axis, i) => (
            <div key={`camera-${axis}`} className="space-y-2">
              <Label>Camera {axis.toUpperCase()}</Label>
              <Slider
                min={-20}
                max={20}
                value={[state.cameraPosition[i]]}
                onValueChange={([value]) => setCameraPosition(axis as 'x' | 'y' | 'z', value)}
              />
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <Switch id="showAxes" checked={showAxes} onCheckedChange={(x) => setShowAxes(x)} />
            <Label htmlFor="showAxes">Show Axes</Label>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}