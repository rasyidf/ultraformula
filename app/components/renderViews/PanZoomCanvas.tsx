import { useEffect, useRef } from "react";
import { usePanZoom, type Viewport } from "~/hooks/usePanZoom";

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels */
  width: number;
  height: number;
  viewport: Viewport;
  dpr: number;
}

interface Props {
  /**
   * Paint the frame. The context is pre-scaled by `dpr` and the surface is
   * cleared / filled with `background`. Apply your own
   * `translate(viewport.x, viewport.y)` + `scale(viewport.zoom)` for
   * world-space content; draw screen-space overlays (legends, labels) without it.
   */
  draw: (d: DrawCtx) => void;
  /** Bump to force a repaint (formula / colour changed). */
  revision?: unknown;
  background?: string;
  className?: string;
}

/**
 * A 2D `<canvas>` with pan/zoom, HiDPI handling and a `ResizeObserver` (so it
 * refits when its panel is resized, not just the window).
 */
export function PanZoomCanvas({ draw, revision, background, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { viewport, bind, reset } = usePanZoom();

  const drawRef = useRef(draw);
  drawRef.current = draw;
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const bgRef = useRef(background);
  bgRef.current = background;
  const rafRef = useRef(0);

  const paint = () => {
    rafRef.current = 0;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (bgRef.current) {
      ctx.fillStyle = bgRef.current;
      ctx.fillRect(0, 0, w, h);
    }
    drawRef.current({ ctx, width: w, height: h, viewport: viewportRef.current, dpr });
  };

  const schedule = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(paint);
  };

  // Repaint on viewport / content change.
  useEffect(schedule, [viewport, revision, background]);

  // Repaint on container resize (panel drag), once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative h-full w-full overflow-hidden"}
      style={{ background }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        style={{ cursor: "grab" }}
        {...bind}
      />
      {(viewport.zoom !== 1 || viewport.x !== 0 || viewport.y !== 0) && (
        <button
          type="button"
          onClick={reset}
          className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
          title="Reset view (double-click)"
        >
          {Math.round(viewport.zoom * 100)}% · reset
        </button>
      )}
    </div>
  );
}
