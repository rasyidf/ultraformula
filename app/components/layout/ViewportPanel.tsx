import { Camera, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { FormulaCanvasWrapper } from "~/components/FormulaCanvasWrapper";
import { Button } from "~/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { getAvailableViews } from "~/lib/renderViews";
import type { EvalStatus } from "~/lib/pipeline/useGraphEvaluation";
import type { NodeError } from "~/lib/pipeline/types";
import { useSceneStore } from "~/stores/sceneStore";
import type { Formula } from "~/types/Formula";

interface Props {
  formula: Formula | null;
  status: EvalStatus;
  errors: NodeError[];
}

export function ViewportPanel({ formula, status, errors }: Props) {
  const activeViewId = useSceneStore((s) => s.activeViewId);
  const setScene = useSceneStore((s) => s.set);
  const resetCameraDefault = useSceneStore((s) => s.reset);

  const views = formula ? getAvailableViews(formula) : [];
  const fatal = !formula && errors.length > 0;

  const screenshot = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#viewport canvas");
    if (!canvas) {
      toast.error("Nothing to capture yet");
      return;
    }
    const link = document.createElement("a");
    link.download = "ultraformula.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <div className="flex items-center gap-2">
          {views.length > 1 && (
            <ToggleGroup
              type="single"
              size="sm"
              value={activeViewId}
              onValueChange={(v) => v && setScene({ activeViewId: v })}
            >
              {views.map((view) => (
                <ToggleGroupItem key={view.id} value={view.id} className="h-7 px-2 text-xs">
                  {view.icon && <view.icon className="mr-1 h-3.5 w-3.5" />}
                  {view.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          {status === "evaluating" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> evaluating
            </span>
          )}
          {status === "error" && errors.length > 0 && (
            <span className="truncate text-xs text-destructive" title={errors.map((e) => e.message).join("\n")}>
              {errors[0].message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetCameraDefault} title="Reset scene">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={screenshot} title="Screenshot">
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div id="viewport" className="relative flex-1 overflow-hidden">
        <FormulaCanvasWrapper
          formula={formula}
          message={fatal ? errors[0].message : null}
        />
        {status === "evaluating" && formula && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/70 p-1.5 backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
