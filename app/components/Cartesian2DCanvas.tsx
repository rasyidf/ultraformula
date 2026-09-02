import { useCallback } from "react";
import {
  PanZoomCanvas,
  type DrawCtx,
} from "~/components/renderViews/PanZoomCanvas";
import { isDarkColor } from "~/lib/viewportColors";
import type { Formula, FormulaParams } from "~/types/Formula";

interface Cartesian2DCanvasProps {
  formula: Formula;
  params: FormulaParams;
  backgroundColor: string;
  lineColor: string;
  showGrid: boolean;
  showAxes: boolean;
  scale: number;
}

export function Cartesian2DCanvas({
  formula,
  params,
  backgroundColor = "#f0f0f0",
  lineColor = "#00ff00",
  showGrid = true,
  showAxes = true,
  scale = 1,
}: Cartesian2DCanvasProps) {
  const draw = useCallback(
    ({ ctx, width, height, viewport }: DrawCtx) => {
      if (!formula.createPlotData) return;
      const dark = isDarkColor(backgroundColor);
      const gridColor = dark ? "#2b3245" : "#dddddd";
      const axisColor = dark ? "#8b93a7" : "#333333";

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      const z = viewport.zoom;

      const cx = width / 2;
      const cy = height / 2;
      const scaleFactor = (Math.min(width, height) / 10) * scale;
      // generous world bounds so pan/zoom-out still shows grid + axes
      const x0 = -width;
      const x1 = width * 2;
      const y0 = -height;
      const y1 = height * 2;

      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5 / z;
        const step = 20;
        ctx.beginPath();
        for (let x = cx - Math.ceil((cx - x0) / step) * step; x < x1; x += step) {
          ctx.moveTo(x, y0);
          ctx.lineTo(x, y1);
        }
        for (let y = cy - Math.ceil((cy - y0) / step) * step; y < y1; y += step) {
          ctx.moveTo(x0, y);
          ctx.lineTo(x1, y);
        }
        ctx.stroke();
      }

      if (showAxes) {
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1 / z;
        ctx.beginPath();
        ctx.moveTo(x0, cy);
        ctx.lineTo(x1, cy);
        ctx.moveTo(cx, y0);
        ctx.lineTo(cx, y1);
        ctx.stroke();

        ctx.fillStyle = axisColor;
        ctx.font = `${10 / z}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        for (let i = -5; i <= 5; i++) {
          if (i === 0) continue;
          const x = cx + i * scaleFactor;
          ctx.beginPath();
          ctx.moveTo(x, cy - 4 / z);
          ctx.lineTo(x, cy + 4 / z);
          ctx.stroke();
          ctx.fillText(String(i), x, cy + 14 / z);
        }
        ctx.textAlign = "right";
        for (let i = -5; i <= 5; i++) {
          if (i === 0) continue;
          const y = cy - i * scaleFactor;
          ctx.beginPath();
          ctx.moveTo(cx - 4 / z, y);
          ctx.lineTo(cx + 4 / z, y);
          ctx.stroke();
          ctx.fillText(String(i), cx - 8 / z, y + 3 / z);
        }
      }

      const plot = formula.createPlotData(params, 300);
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2 / z;
      for (let i = 0; i < plot.x.length; i++) {
        const px = cx + plot.x[i] * scaleFactor;
        const py = cy - plot.y[i] * scaleFactor;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    },
    [formula, params, backgroundColor, lineColor, showGrid, showAxes, scale],
  );

  return (
    <PanZoomCanvas draw={draw} revision={draw} background={backgroundColor} />
  );
}
