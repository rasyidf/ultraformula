import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import type { ParameterMetadata } from "~/types/Formula";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LockIcon, LockOpenIcon } from "lucide-react";

interface ParameterControlProps {
  paramKey: string;
  metadata: ParameterMetadata;
  value: number;
  isLocked: boolean;
  onChange: (value: number) => void;
  onToggleLock: () => void;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  paramKey,
  metadata,
  value,
  isLocked,
  onChange,
  onToggleLock
}) => {
  let controlElement;
  switch (metadata.controlType) {
    case "toggle":
      controlElement = (
        <div className="flex items-center space-x-2">
          <Switch id={paramKey} checked={!!value} disabled={isLocked} onCheckedChange={(e) => onChange(e ? 1 : 0)} />
          <Label htmlFor={paramKey}>{metadata.name}</Label>
        </div>
      );
      break;
    case "input":
      controlElement = (
        <Input
          type="number"
          value={value}
          min={metadata.min}
          max={metadata.max}
          step={metadata.step}
          onChange={e => onChange(Number(e.target.value))}
          disabled={isLocked}
          className="input-class"
        />
      );
      break;
    case "select":
      controlElement = (
        <Select
          value={value.toString()}
          onValueChange={e => onChange(Number(e))}
          disabled={isLocked}>
          <SelectTrigger id="formulaType">
            <SelectValue placeholder="Select formula type" />
          </SelectTrigger>
          <SelectContent>
            {metadata?.choices?.map(key => (
              <SelectItem key={key} value={key.toString()}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      );
      break;
    default:
      controlElement = (
        <Slider
          id={paramKey}
          min={metadata.min}
          max={metadata.max}
          step={metadata.step}
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          disabled={isLocked}
        />
      );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={paramKey}>{metadata.name}</Label>
          <p className="text-xs text-muted-foreground">{metadata.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {metadata.controlType === "toggle" ? (value ? "On" : "Off") : value?.toFixed(2)}
          </span>
          <Button variant="ghost" size="icon" onClick={onToggleLock}>
            {isLocked ? <LockIcon /> : <LockOpenIcon />}
          </Button>
        </div>
      </div>
      {controlElement}
    </div>
  );
};
