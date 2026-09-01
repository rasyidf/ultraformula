import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { Formula, FormulaParams } from "./Formula";

export interface RenderViewProps {
  formula: Formula;
  params: FormulaParams;
}

/** One way of displaying a formula (a 3D mesh, a 2D plot, a tile grid, ...). */
export interface RenderView {
  id: string;
  label: string;
  /** Drives which control panels (camera, materials, lighting) are shown. */
  dimension: "2d" | "3d";
  icon?: LucideIcon;
  /** Whether this view can render the given formula. */
  supports: (formula: Formula) => boolean;
  Component: ComponentType<RenderViewProps>;
}
