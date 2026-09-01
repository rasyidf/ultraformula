import { useEffect, useRef } from "react";
import { Card, CardContent } from "~/components/ui/card";
import type { Formula, FormulaParams } from "~/types/Formula";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !formula.createTileGrid) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !formula.createTileGrid) return;

      const { width: w, height: h } = container.getBoundingClientRect();
      canvas.width = w;
      canvas.height = h;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      const grid = formula.createTileGrid(params);
      const cell = Math.max(1, Math.floor(Math.min(w / grid.width, h / grid.height)));
      const gridW = cell * grid.width;
      const gridH = cell * grid.height;
      const originX = Math.floor((w - gridW) / 2);
      const originY = Math.floor((h - gridH) / 2);

      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const id = grid.cells[y * grid.width + x];
          const px = originX + x * cell;
          const py = originY + y * cell;

          if (id < 0 || id >= grid.palette.length) {
            // Contradiction / unresolved cell.
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(px, py, cell, cell);
            ctx.strokeStyle = "#000000";
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + cell, py + cell);
            ctx.stroke();
          } else {
            ctx.fillStyle = grid.palette[id].color;
            ctx.fillRect(px, py, cell, cell);
          }
        }
      }

      if (showGrid && cell >= 4) {
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= grid.width; x++) {
          ctx.moveTo(originX + x * cell + 0.5, originY);
          ctx.lineTo(originX + x * cell + 0.5, originY + gridH);
        }
        for (let y = 0; y <= grid.height; y++) {
          ctx.moveTo(originX, originY + y * cell + 0.5);
          ctx.lineTo(originX + gridW, originY + y * cell + 0.5);
        }
        ctx.stroke();
      }

      drawLegend(ctx, grid.palette);
    };

    render();
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [formula, params, backgroundColor, showGrid]);

  return (
    <Card
      className="w-full h-full border-0 rounded-none py-0"
      style={{ backgroundColor }}
      ref={containerRef}
    >
      <CardContent className="p-0 h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </CardContent>
    </Card>
  );
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  palette: { color: string; label: string }[]
) {
  const pad = 10;
  const swatch = 12;
  const lineH = 18;
  ctx.font = "12px sans-serif";
  const boxW =
    swatch + 8 + Math.max(...palette.map((p) => ctx.measureText(p.label).width)) + pad * 2;
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
    ctx.textBaseline = "top";
    ctx.fillText(p.label, pad + pad + swatch + 8, y);
  });
}
