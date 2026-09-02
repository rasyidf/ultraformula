import { useCallback } from "react";
import type { Formula, FormulaParams } from "~/types/Formula";
import { PanZoomCanvas, type DrawCtx } from "./PanZoomCanvas";

interface TileGridCanvasProps {
  formula: Formula;
  params: FormulaParams;
  backgroundColor: string;
  showGrid: boolean;
}

export function TileGridCanvas({
  formula,
  params,
  backgroundColor = "#f0f0f0",
  showGrid = true,
}: TileGridCanvasProps) {
  const draw = useCallback(
    ({ ctx, width, height, viewport }: DrawCtx) => {
      if (!formula.createTileGrid) return;
      const grid = formula.createTileGrid(params);

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      const cell = Math.max(
        1,
        Math.floor(Math.min(width / grid.width, height / grid.height)),
      );
      const gridW = cell * grid.width;
      const gridH = cell * grid.height;
      const ox = Math.floor((width - gridW) / 2);
      const oy = Math.floor((height - gridH) / 2);

      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const id = grid.cells[y * grid.width + x];
          const px = ox + x * cell;
          const py = oy + y * cell;
          if (id < 0 || id >= grid.palette.length) {
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(px, py, cell, cell);
          } else {
            ctx.fillStyle = grid.palette[id].color;
            ctx.fillRect(px, py, cell, cell);
          }
        }
      }

      if (showGrid && cell * viewport.zoom >= 4) {
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1 / viewport.zoom;
        ctx.beginPath();
        for (let x = 0; x <= grid.width; x++) {
          ctx.moveTo(ox + x * cell + 0.5, oy);
          ctx.lineTo(ox + x * cell + 0.5, oy + gridH);
        }
        for (let y = 0; y <= grid.height; y++) {
          ctx.moveTo(ox, oy + y * cell + 0.5);
          ctx.lineTo(ox + gridW, oy + y * cell + 0.5);
        }
        ctx.stroke();
      }
      ctx.restore();

      drawLegend(ctx, grid.palette);
    },
    [formula, params, showGrid],
  );

  return <PanZoomCanvas draw={draw} revision={draw} background={backgroundColor} />;
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  palette: { color: string; label: string }[],
) {
  const pad = 10;
  const swatch = 12;
  const lineH = 18;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "top";
  const boxW =
    swatch +
    8 +
    Math.max(...palette.map((p) => ctx.measureText(p.label).width)) +
    pad * 2;
  const boxH = palette.length * lineH + pad * 2;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(pad, pad, boxW, boxH);
  ctx.strokeRect(pad, pad, boxW, boxH);

  palette.forEach((p, i) => {
    const y = pad + pad + i * lineH;
    ctx.fillStyle = p.color;
    ctx.fillRect(pad + pad, y, swatch, swatch);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(pad + pad, y, swatch, swatch);
    ctx.fillStyle = "#000000";
    ctx.fillText(p.label, pad + pad + swatch + 8, y);
  });
}
