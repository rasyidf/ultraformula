import { Camera, EyeOff, Loader2, RotateCcw } from "lucide-react";
import { Suspense } from "react";
import { toast } from "sonner";
import { FormulaCanvasWrapper } from "~/components/FormulaCanvasWrapper";
import { Button } from "~/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { getAvailableViews } from "~/lib/renderViews";
import type { EvalStatus } from "~/lib/pipeline/useGraphEvaluation";
import type { NodeError } from "~/lib/pipeline/types";
import { useSceneStore } from "~/stores/sceneStore";
import { useUiStore } from "~/stores/uiStore";
import type { Formula } from "~/types/Formula";

const EMPTY_PARAMS = {} as const;

interface Props {
  formula: Formula | null;
  status: EvalStatus;
  errors: NodeError[];
}

export function ViewportPanel({ formula, status, errors }: Props) {
  const activeViewId = useSceneStore((s) => s.activeViewId);
  const setScene = useSceneStore((s) => s.set);
  const resetScene = useSceneStore((s) => s.reset);
  const showThumbnails = useUiStore((s) => s.showViewThumbnails);
  const setUi = useUiStore((s) => s.set);

  const views = formula ? getAvailableViews(formula) : [];
  const fatal = !formula && errors.length > 0;
  const others = views.filter((v) => v.id !== activeViewId);

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
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
          {status === "paused" && (
            <span className="text-xs text-amber-500">evaluation paused</span>
          )}
          {status === "error" && errors.length > 0 && (
            <span
              className="truncate text-xs text-destructive"
              title={errors.map((e) => e.message).join("\n")}
            >
              {errors[0].message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetScene} title="Reset scene">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={screenshot} title="Screenshot">
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div id="viewport" className="relative min-h-0 flex-1 overflow-hidden">
        <FormulaCanvasWrapper
          formula={formula}
          message={fatal ? errors[0].message : null}
        />

        {status === "evaluating" && formula && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/70 p-1.5 backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {formula && showThumbnails && others.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-end gap-2">
            {others.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setScene({ activeViewId: view.id })}
                title={`Show ${view.label}`}
                className="group relative h-[84px] w-[112px] overflow-hidden rounded-md border border-border/70 bg-background/80 shadow-md ring-offset-background transition hover:border-primary hover:ring-2 hover:ring-primary/50"
              >
                <div className="pointer-events-none absolute inset-0">
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                    <view.Component formula={formula} params={EMPTY_PARAMS} thumbnail />
                  </Suspense>
                </div>
                <span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-center text-[9px] font-medium leading-none text-foreground">
                  {view.label}
                </span>
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-background/80 backdrop-blur"
              title="Hide thumbnails"
              onClick={() => setUi({ showViewThumbnails: false })}
            >
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
