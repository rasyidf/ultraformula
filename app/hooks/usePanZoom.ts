import { useCallback, useRef, useState } from "react";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

const IDENTITY: Viewport = { x: 0, y: 0, zoom: 1 };
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * Transient pan/zoom state for a 2D canvas — wheel zooms toward the cursor,
 * pointer drag pans, double-click resets. Not persisted (like the 3D orbit).
 */
export function usePanZoom() {
  const [viewport, setViewport] = useState<Viewport>(IDENTITY);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const reset = useCallback(() => setViewport(IDENTITY), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setViewport((v) => {
      const factor = Math.exp(-e.deltaY * 0.0015);
      const zoom = clampZoom(v.zoom * factor);
      const k = zoom / v.zoom;
      // keep the point under the cursor fixed
      return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, zoom };
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y };
    },
    [viewport.x, viewport.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setViewport((v) => ({
      ...v,
      x: d.vx + (e.clientX - d.x),
      y: d.vy + (e.clientY - d.y),
    }));
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  const bind = {
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onDoubleClick: reset,
  };

  return { viewport, setViewport, reset, bind };
}
