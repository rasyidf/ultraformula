import { Suspense, useEffect } from "react";
import { resolveActiveView } from "~/lib/renderViews";
import type { Formula } from "~/types/Formula";
import { useSceneStore } from "~/stores/sceneStore";

const EMPTY_PARAMS = {} as const;

interface Props {
  formula: Formula | null;
  message?: string | null;
}

/** Dispatches the synthetic pipeline Formula to the active render view. */
export function FormulaCanvasWrapper({ formula, message }: Props) {
  const activeViewId = useSceneStore((s) => s.activeViewId);
  const setScene = useSceneStore((s) => s.set);

  const activeView = formula ? resolveActiveView(formula, activeViewId) : null;

  useEffect(() => {
    if (activeView && activeView.id !== activeViewId) {
      setScene({ activeViewId: activeView.id });
    }
  }, [activeView, activeViewId, setScene]);

  if (!formula || !activeView) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {message ?? "Connect a node to the Output to see a render."}
      </div>
    );
  }

  const { Component } = activeView;
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          loading view…
        </div>
      }
    >
      <Component formula={formula} params={EMPTY_PARAMS} />
    </Suspense>
  );
}
