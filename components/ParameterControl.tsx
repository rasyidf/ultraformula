import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { LockClosedIcon, LockOpen1Icon } from "@radix-ui/react-icons";
import { ParameterMetadata } from "@/types/Formula";

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
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={paramKey}>{metadata.name}</Label>
        <p className="text-xs text-muted-foreground">{metadata.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{value?.toFixed(2)}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLock}
        >
          {isLocked ? <LockClosedIcon /> : <LockOpen1Icon />}
        </Button>
      </div>
    </div>
    <Slider
      id={paramKey}
      min={metadata.min}
      max={metadata.max}
      step={metadata.step}
      value={[value]}
      onValueChange={([newValue]) => onChange(newValue)}
      disabled={isLocked}
    />
  </div>
);
