import { useEffect } from "react";
import { useSuperformulaContext } from "~/contexts/FormulaContext";
import { getFormula } from "~/lib/formulas";
import { Card, CardContent } from "~/components/ui/card";

export function FormulaCanvasWrapper() {
  const { formulaState, canvasSettings, activeView, setActiveViewId } = useSuperformulaContext();

  const formula = getFormula(formulaState.formulaType);

  // Keep the stored id in sync when the resolver had to fall back (e.g. after
  // switching to a formula that doesn't support the previously-active view).
  useEffect(() => {
    if (activeView && activeView.id !== canvasSettings.activeViewId) {
      setActiveViewId(activeView.id);
    }
  }, [activeView, canvasSettings.activeViewId, setActiveViewId]);

  if (!activeView) {
    return (
      <Card className="w-full h-[500px] lg:h-[calc(100vh-12rem)]">
        <CardContent className="flex h-full items-center justify-center p-0 text-sm text-muted-foreground">
          This formula has no available render view.
        </CardContent>
      </Card>
    );
  }

  const { Component } = activeView;
  return <Component formula={formula} params={formulaState.params} />;
}
