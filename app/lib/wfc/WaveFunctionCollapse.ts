/**
 * Wave Function Collapse — the "simple tiled model".
 *
 * A break from the `calculate(x,y,z) -> number` paradigm: the output is a grid of
 * discrete tile ids produced by constraint propagation, not by evaluating a
 * function per point.
 *
 * Every cell starts as a superposition of *all* tiles. We repeatedly:
 *   1. pick the undecided cell with the fewest remaining options (lowest entropy),
 *   2. collapse it to one tile, chosen randomly weighted by tile frequency,
 *   3. propagate: any neighbour option with no supporting tile across the shared
 *      edge is removed, which can cascade.
 * If a cell ever drops to zero options that's a contradiction and we restart with
 * a fresh seed. After `maxRetries` failures we return the partial grid.
 */

// Neighbour directions, indexed 0..3. dx/dy give the offset to the neighbour;
// OPPOSITE[dir] is the direction pointing back.
export const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],  // 0: +x (east)
  [-1, 0], // 1: -x (west)
  [0, 1],  // 2: +y (south)
  [0, -1], // 3: -y (north)
];
export const OPPOSITE = [1, 0, 3, 2] as const;

export interface WfcTileset {
  /** Relative frequency of each tile; index === tile id. */
  tiles: { weight: number }[];
  /**
   * allowed[dir][a][b] === true means: if tile `a` is at some cell, tile `b`
   * is permitted in the neighbour cell that lies in direction `dir` from `a`.
   */
  allowed: boolean[][][];
}

export interface WfcResult {
  cells: Int16Array;
  contradiction: boolean;
  /** Number of restarts that were needed (0 = solved first try). */
  retries: number;
}

/** Park–Miller LCG — identical to the generator in app/lib/formulas/noises/*. */
function makeRng(seed: number) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function runWfc(
  tileset: WfcTileset,
  width: number,
  height: number,
  seed: number,
  maxRetries = 10
): WfcResult {
  const T = tileset.tiles.length;
  const count = width * height;
  const weights = tileset.tiles.map((t) => Math.max(t.weight, 1e-6));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const rng = makeRng(seed + attempt * 2654435761);

    // wave[cell] is a length-T boolean array of still-possible tiles.
    const wave: boolean[][] = new Array(count);
    const optionCount = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      wave[i] = new Array(T).fill(true);
      optionCount[i] = T;
    }

    let contradiction = false;
    const stack: number[] = [];

    const collapse = (cell: number) => {
      const opts = wave[cell];
      let total = 0;
      for (let t = 0; t < T; t++) if (opts[t]) total += weights[t];
      let pick = rng() * total;
      let chosen = -1;
      for (let t = 0; t < T; t++) {
        if (!opts[t]) continue;
        pick -= weights[t];
        if (pick <= 0) {
          chosen = t;
          break;
        }
      }
      if (chosen < 0) for (let t = 0; t < T; t++) if (opts[t]) chosen = t;
      for (let t = 0; t < T; t++) opts[t] = t === chosen;
      optionCount[cell] = 1;
      stack.push(cell);
    };

    const propagate = () => {
      while (stack.length > 0) {
        const cell = stack.pop()!;
        const cx = cell % width;
        const cy = (cell - cx) / width;
        const curOpts = wave[cell];

        for (let dir = 0; dir < 4; dir++) {
          const nx = cx + DIRS[dir][0];
          const ny = cy + DIRS[dir][1];
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ncell = ny * width + nx;
          const nOpts = wave[ncell];

          let changed = false;
          for (let b = 0; b < T; b++) {
            if (!nOpts[b]) continue;
            // Does any still-possible tile in `cell` permit `b` across this edge?
            let supported = false;
            for (let a = 0; a < T; a++) {
              if (curOpts[a] && tileset.allowed[dir][a][b]) {
                supported = true;
                break;
              }
            }
            if (!supported) {
              nOpts[b] = false;
              optionCount[ncell]--;
              changed = true;
            }
          }

          if (optionCount[ncell] === 0) {
            contradiction = true;
            return;
          }
          if (changed) stack.push(ncell);
        }
      }
    };

    while (!contradiction) {
      // Find the lowest-entropy undecided cell (fewest options), RNG-jittered ties.
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < count; i++) {
        const c = optionCount[i];
        if (c <= 1) continue;
        const score = c + rng() * 0.5;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      if (best === -1) break; // everything decided

      collapse(best);
      propagate();
    }

    if (!contradiction) {
      const cells = new Int16Array(count);
      for (let i = 0; i < count; i++) {
        const opts = wave[i];
        let id = -1;
        for (let t = 0; t < T; t++) if (opts[t]) { id = t; break; }
        cells[i] = id;
      }
      return { cells, contradiction: false, retries: attempt };
    }
  }

  // Give up: return a best-effort grid, -1 where unresolved.
  const cells = new Int16Array(count).fill(-1);
  return { cells, contradiction: true, retries: maxRetries };
}

/**
 * Build a symmetric `allowed` table from a predicate over ordered tile pairs.
 * `canTouch(a, b)` should be symmetric; it's applied identically in all 4
 * directions (good enough for edge-less "colour" tilesets like biomes).
 */
export function symmetricAdjacency(
  numTiles: number,
  canTouch: (a: number, b: number) => boolean
): boolean[][][] {
  const perDir = () =>
    Array.from({ length: numTiles }, (_, a) =>
      Array.from({ length: numTiles }, (_, b) => canTouch(a, b))
    );
  return [perDir(), perDir(), perDir(), perDir()];
}
