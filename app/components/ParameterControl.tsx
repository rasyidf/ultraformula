import { LockIcon, LockOpenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";
import type { ParameterMetadata } from "~/types/Formula";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

interface ParameterControlProps {
  paramKey: string;
  metadata: ParameterMetadata;
  value: number;
  isLocked?: boolean;
  onChange: (value: number) => void;
  onToggleLock?: () => void;
}

/** Decimal places implied by the step (0 for integer steps). */
function decimalsForStep(step: number | undefined): number {
  if (!step || step >= 1) return 0;
  if (step >= 0.1) return 1;
  if (step >= 0.01) return 2;
  return 3;
}

function clamp(v: number, min?: number, max?: number): number {
  if (typeof min === "number" && v < min) return min;
  if (typeof max === "number" && v > max) return max;
  return v;
}

function format(v: number, decimals: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(decimals);
}

/** Compact numeric field with a local draft so partial input isn't clobbered. */
function NumberField({
  value,
  decimals,
  min,
  max,
  step,
  disabled,
  onCommit,
  className,
}: {
  value: number;
  decimals: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Drop the draft only when an outside change makes it stale — keep it while
  // the user is mid-edit (so "1." or "1.50" isn't reformatted under the cursor).
  useEffect(() => {
    setDraft((d) => (d !== null && Number(d) === value ? d : null));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      value={draft ?? format(value, decimals)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isFinite(n)) onCommit(clamp(n, min, max));
      }}
      onBlur={() => setDraft(null)}
      className={cn(
        "h-7 rounded-md border border-input bg-transparent px-2 text-right text-xs tabular-nums shadow-xs outline-none transition-[color,box-shadow]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
    />
  );
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  paramKey,
  metadata,
  value,
  isLocked = false,
  onChange,
  onToggleLock,
}) => {
  // Guard against an undefined value (a param the state hasn't been seeded with
  // yet) so controls never crash on `.toString()` / `.toFixed()`.
  const safeValue = value ?? metadata.default ?? metadata.min ?? 0;
  const decimals = decimalsForStep(metadata.step);

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <Label htmlFor={paramKey} className="text-xs font-medium">
          {metadata.name}
        </Label>
        {metadata.description && (
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {metadata.description}
          </p>
        )}
      </div>
      {onToggleLock && (
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 h-6 w-6 shrink-0 text-muted-foreground"
          onClick={onToggleLock}
          title={isLocked ? "Unlock" : "Lock"}
        >
          {isLocked ? (
            <LockIcon className="h-3.5 w-3.5" />
          ) : (
            <LockOpenIcon className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );

  if (metadata.controlType === "toggle") {
    return (
      <div className="space-y-2">
        {header}
        <div className="flex items-center gap-2">
          <Switch
            id={paramKey}
            checked={!!safeValue}
            disabled={isLocked}
            onCheckedChange={(e) => onChange(e ? 1 : 0)}
          />
          <span className="text-xs text-muted-foreground">
            {safeValue ? "On" : "Off"}
          </span>
        </div>
      </div>
    );
  }

  if (metadata.controlType === "select") {
    return (
      <div className="space-y-2">
        {header}
        <Select
          value={safeValue.toString()}
          onValueChange={(e) => onChange(Number(e))}
          disabled={isLocked}
        >
          <SelectTrigger id={paramKey} className="h-8 text-xs">
            <SelectValue placeholder={`Select ${metadata.name}`} />
          </SelectTrigger>
          <SelectContent>
            {metadata.choices?.map((key, i) => (
              <SelectItem key={key} value={key.toString()} className="text-xs">
                {metadata.choiceLabels?.[i] ?? key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Default: slider + editable numeric field.
  return (
    <div className="space-y-2">
      {header}
      <div className="flex items-center gap-2.5">
        <Slider
          id={paramKey}
          min={metadata.min}
          max={metadata.max}
          step={metadata.step}
          value={[safeValue]}
          onValueChange={([v]) => onChange(v)}
          disabled={isLocked}
          className="flex-1"
        />
        <NumberField
          value={safeValue}
          decimals={decimals}
          min={metadata.min}
          max={metadata.max}
          step={metadata.step}
          disabled={isLocked}
          onCommit={onChange}
          className="w-16"
        />
        <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
          {metadata.unit ?? ""}
        </span>
      </div>
    </div>
  );
};
