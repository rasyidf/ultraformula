import { Cuboid, Grid2x2, Image, LineChart, Table2 } from "lucide-react";
import { lazy } from "react";
import { Data2DView } from "~/components/renderViews/Data2DView";
import { Plot2DView } from "~/components/renderViews/Plot2DView";
import { Texture2DView } from "~/components/renderViews/Texture2DView";
import { TileGrid2DView } from "~/components/renderViews/TileGrid2DView";
import type { Formula } from "~/types/Formula";
import type { RenderView } from "~/types/RenderView";

// three/drei is heavy — only load it when a 3D view is actually shown.
const Mesh3DView = lazy(() =>
  import("~/components/renderViews/Mesh3DView").then((m) => ({
    default: m.Mesh3DView,
  })),
);

/** Fallback when a formula has no explicit `metadata.renderViews`. */
function inferViews(dimensions: ("2d" | "3d")[]): string[] {
  const views: string[] = [];
  if (dimensions.includes("3d")) views.push("mesh3d");
  if (dimensions.includes("2d")) views.push("plot2d");
  return views;
}

function declaredViews(formula: Formula): string[] {
  return formula.metadata.renderViews ?? inferViews(formula.metadata.supportedDimensions);
}

export const renderViewRegistry: RenderView[] = [
  {
    id: "mesh3d",
    label: "3D Mesh",
    dimension: "3d",
    icon: Cuboid,
    supports: (f) => declaredViews(f).includes("mesh3d"),
    Component: Mesh3DView,
  },
  {
    id: "texture2d",
    label: "Texture",
    dimension: "2d",
    icon: Image,
    supports: (f) =>
      declaredViews(f).includes("texture2d") && typeof f.createTexture === "function",
    Component: Texture2DView,
  },
  {
    id: "plot2d",
    label: "2D Plot",
    dimension: "2d",
    icon: LineChart,
    supports: (f) => declaredViews(f).includes("plot2d") && typeof f.createPlotData === "function",
    Component: Plot2DView,
  },
  {
    id: "tileGrid2d",
    label: "Tile Grid",
    dimension: "2d",
    icon: Grid2x2,
    supports: (f) => declaredViews(f).includes("tileGrid2d") && typeof f.createTileGrid === "function",
    Component: TileGrid2DView,
  },
  {
    id: "data2d",
    label: "Data",
    dimension: "2d",
    icon: Table2,
    supports: (f) => declaredViews(f).includes("data2d"),
    Component: Data2DView,
  },
];

export function getAvailableViews(formula: Formula): RenderView[] {
  return renderViewRegistry.filter((v) => v.supports(formula));
}

/**
 * The requested view if the formula still supports it, else the first available
 * view, else null.
 */
export function resolveActiveView(formula: Formula, activeViewId: string): RenderView | null {
  const available = getAvailableViews(formula);
  return available.find((v) => v.id === activeViewId) ?? available[0] ?? null;
}
