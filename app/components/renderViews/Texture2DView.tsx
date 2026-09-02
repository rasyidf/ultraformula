import { useCallback, useMemo } from "react";
import { useViewportColors } from "~/hooks/useViewportColors";
import type { RenderViewProps } from "~/types/RenderView";
import { PanZoomCanvas, type DrawCtx } from "./PanZoomCanvas";

const TEXTURE_RES = 320;

/** Top-down colourised raster of the field — a pannable / zoomable "texture". */
export function Texture2DView({ formula }: RenderViewProps) {
  const background = useViewportColors().background;

  // Build the source bitmap once per formula, off the draw path.
  const source = useMemo(() => {
    if (!formula.createTexture) return null;
    const { width, height, rgb } = formula.createTexture(TEXTURE_RES);
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const img = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      img.data[i * 4] = rgb[i * 3] * 255;
      img.data[i * 4 + 1] = rgb[i * 3 + 1] * 255;
      img.data[i * 4 + 2] = rgb[i * 3 + 2] * 255;
      img.data[i * 4 + 3] = 255;
    }
    c.getContext("2d")!.putImageData(img, 0, 0);
    return c;
  }, [formula]);

  const draw = useCallback(
    ({ ctx, width, height, viewport }: DrawCtx) => {
      if (!source) return;
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      const size = Math.max(0, Math.min(width, height) - 32);
      const ox = (width - size) / 2;
      const oy = (height - size) / 2;
      ctx.imageSmoothingEnabled = viewport.zoom < 2;
      ctx.drawImage(source, ox, oy, size, size);
      ctx.strokeStyle = "rgba(128,128,128,0.4)";
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.strokeRect(ox, oy, size, size);
      ctx.restore();
    },
    [source],
  );

  return <PanZoomCanvas draw={draw} revision={source} background={background} />;
}
