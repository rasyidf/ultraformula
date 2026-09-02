import { useMemo } from "react";
import type { RenderViewProps } from "~/types/RenderView";

const GRID_N = 16;

/** Numeric table of the output — sampled field grid, tile grid, or a scalar. */
export function Data2DView({ formula }: RenderViewProps) {
  const content = useMemo(() => {
    if (typeof formula.scalarValue === "number") {
      return { kind: "scalar" as const, value: formula.scalarValue };
    }
    if (typeof formula.createTileGrid === "function") {
      return { kind: "tiles" as const, grid: formula.createTileGrid({}) };
    }
    if (typeof formula.createFieldGrid === "function") {
      return { kind: "field" as const, grid: formula.createFieldGrid(GRID_N) };
    }
    return { kind: "empty" as const };
  }, [formula]);

  if (content.kind === "scalar") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          scalar output
        </span>
        <span className="font-mono text-4xl tabular-nums">
          {content.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </span>
      </div>
    );
  }

  if (content.kind === "tiles") {
    const { width, height, cells, palette } = content.grid;
    const counts = new Map<number, number>();
    for (const c of cells) counts.set(c, (counts.get(c) ?? 0) + 1);
    return (
      <div className="h-full w-full overflow-auto">
        <div className="p-4">
          <p className="pb-2 text-xs text-muted-foreground">
            {width} × {height} tiles
          </p>
          <table className="text-xs">
            <tbody>
              {palette.map((p, i) => (
                <tr key={p.label}>
                  <td className="py-0.5 pr-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm align-middle"
                      style={{ background: p.color }}
                    />
                  </td>
                  <td className="py-0.5 pr-4 font-medium">{p.label}</td>
                  <td className="py-0.5 pr-4 text-right tabular-nums text-muted-foreground">
                    {counts.get(i) ?? 0}
                  </td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">
                    {(((counts.get(i) ?? 0) / cells.length) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (content.kind === "field") {
    const { width, height, data, bounds } = content.grid;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
    const range = max - min || 1;
    const coord = (i: number, n: number) =>
      (bounds.minX + (i / (n - 1)) * bounds.size).toFixed(0);

    return (
      <div className="h-full w-full overflow-auto">
        <div className="p-3">
          <p className="pb-2 text-[11px] text-muted-foreground">
            {width}×{height} samples · min {min.toFixed(3)} · max{" "}
            {max.toFixed(3)} · mean {(sum / data.length).toFixed(3)}
          </p>
          <table className="border-collapse font-mono text-[10px] tabular-nums">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background px-1 py-0.5 text-muted-foreground">
                  z\x
                </th>
                {Array.from({ length: width }, (_, i) => (
                  <th key={i} className="px-1 py-0.5 text-muted-foreground">
                    {coord(i, width)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: height }, (_, j) => (
                <tr key={j}>
                  <td className="sticky left-0 bg-background px-1 py-0.5 text-muted-foreground">
                    {coord(j, height)}
                  </td>
                  {Array.from({ length: width }, (_, i) => {
                    const v = data[j * width + i];
                    const t = (v - min) / range;
                    return (
                      <td
                        key={i}
                        className="px-1 py-0.5 text-right"
                        style={{
                          background: `color-mix(in oklch, var(--primary) ${(
                            t * 60
                          ).toFixed(0)}%, transparent)`,
                        }}
                      >
                        {v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No tabular data for this output.
    </div>
  );
}
