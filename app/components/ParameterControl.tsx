import { LockIcon, LockOpenIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import type { ParameterMetadata } from "~/types/Formula";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

interface ParameterControlProps {
  paramKey: string;
  metadata: ParameterMetadata;
  value: number;
  isLocked?: boolean;
  onChange: (value: number) => void;
  onToggleLock?: () => void;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  paramKey,
  metadata,
  value,
  isLocked = false,
  onChange,
  onToggleLock
}) => {
  // Guard against an undefined value (e.g. a param the current state hasn't
  // been seeded with yet) so controls never crash on `.toString()` / `.toFixed()`.
  const safeValue = value ?? metadata.default ?? metadata.min ?? 0;

  let controlElement;
  switch (metadata.controlType) {
    case "toggle":
      controlElement = (
        <div className="flex items-center space-x-2">
          <Switch id={paramKey} checked={!!safeValue} disabled={isLocked} onCheckedChange={(e) => onChange(e ? 1 : 0)} />
          <Label htmlFor={paramKey}>{metadata.name}</Label>
        </div>
      );
      break;
    case "input":
      controlElement = (
        <Input
          type="number"
          value={safeValue}
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
          value={safeValue.toString()}
          onValueChange={e => onChange(Number(e))}
          disabled={isLocked}>
          <SelectTrigger id={paramKey}>
            <SelectValue placeholder={`Select ${metadata.name}`} />
          </SelectTrigger>
          <SelectContent>
            {metadata?.choices?.map((key, i) => (
              <SelectItem key={key} value={key.toString()}>
                {metadata.choiceLabels?.[i] ?? key}
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
          value={[safeValue]}
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
            {metadata.controlType === "toggle"
              ? (safeValue ? "On" : "Off")
              : metadata.controlType === "select"
                ? (metadata.choiceLabels?.[metadata.choices?.indexOf(Number(safeValue)) ?? -1] ?? safeValue)
                : safeValue.toFixed(2)}
          </span>
          {onToggleLock && (
            <Button variant="ghost" size="icon" onClick={onToggleLock}>
              {isLocked ? <LockIcon /> : <LockOpenIcon />}
            </Button>
          )}
        </div>
      </div>
      {controlElement}
    </div>
  );
};
