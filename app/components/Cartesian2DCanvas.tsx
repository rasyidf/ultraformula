import { useEffect, useRef } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import type { Formula, FormulaParams } from '~/types/Formula';

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
  backgroundColor = '#f0f0f0',
  lineColor = '#00ff00',
  showGrid = true,
  showAxes = true,
  scale = 1
}: Cartesian2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !formula.createPlotData) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      renderCanvas();
    };

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [formula, params, backgroundColor, lineColor, showGrid, showAxes, scale]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !formula.createPlotData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid and axes
    if (showGrid) {
      drawGrid(ctx, width, height, centerX, centerY);
    }

    if (showAxes) {
      drawAxes(ctx, width, height, centerX, centerY);
    }

    // Get plot data
    const resolution = 300;
    const plotData = formula.createPlotData(params, resolution);

    // Scale factor (pixels per unit)
    const scaleFactor = Math.min(width, height) / 10 * scale;

    // Draw the function
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;

    let firstPoint = true;
    for (let i = 0; i < plotData.x.length; i++) {
      const x = centerX + plotData.x[i] * scaleFactor;
      const y = centerY - plotData.y[i] * scaleFactor; // Invert Y for screen coordinates
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ) => {
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.5;

    // Grid spacing in pixels
    const gridSpacing = 20;

    // Vertical grid lines
    for (let x = centerX % gridSpacing; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = centerY % gridSpacing; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ) => {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Draw tick marks and labels
    const scaleFactor = Math.min(width, height) / 10 * scale;
    const tickSpacing = 1; // 1 unit spacing
    
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // X-axis ticks and labels
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue; // Skip origin
      
      const x = centerX + i * scaleFactor * tickSpacing;
      
      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, centerY - 5);
      ctx.lineTo(x, centerY + 5);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#000000';
      ctx.fillText(i.toString(), x, centerY + 15);
    }
    
    // Y-axis ticks and labels
    ctx.textAlign = 'right';
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue; // Skip origin
      
      const y = centerY - i * scaleFactor * tickSpacing;
      
      // Draw tick
      ctx.beginPath();
      ctx.moveTo(centerX - 5, y);
      ctx.lineTo(centerX + 5, y);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#000000';
      ctx.fillText(i.toString(), centerX - 10, y + 4);
    }
    
    // Draw origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', centerX - 10, centerY + 15);
  };

  return (
    <Card className="w-full h-[500px] lg:h-[calc(100vh-12rem)]" style={{ backgroundColor }} ref={containerRef}>
      <CardContent className="p-0 h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </CardContent>
    </Card>
  );
}