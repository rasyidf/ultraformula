import { useEffect, useRef } from "react";
import { useViewportColors } from "~/hooks/useViewportColors";
import type { RenderViewProps } from "~/types/RenderView";

const TEXTURE_RES = 320;

/** Top-down colourised raster of the field — a "texture" preview. */
export function Texture2DView({ formula }: RenderViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const background = useViewportColors().background;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !formula.createTexture) return;

    const { width, height, rgb } = formula.createTexture(TEXTURE_RES);
    const src = document.createElement("canvas");
    src.width = width;
    src.height = height;
    const img = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      img.data[i * 4] = rgb[i * 3] * 255;
      img.data[i * 4 + 1] = rgb[i * 3 + 1] * 255;
      img.data[i * 4 + 2] = rgb[i * 3 + 2] * 255;
      img.data[i * 4 + 3] = 255;
    }
    src.getContext("2d")!.putImageData(img, 0, 0);

    const draw = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect();
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, cw, ch);
      const size = Math.max(0, Math.min(cw, ch) - 32);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src, (cw - size) / 2, (ch - size) / 2, size, size);
      ctx.strokeStyle = "rgba(128,128,128,0.4)";
      ctx.strokeRect((cw - size) / 2, (ch - size) / 2, size, size);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [formula, background]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
