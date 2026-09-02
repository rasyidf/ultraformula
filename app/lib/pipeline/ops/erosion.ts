/**
 * Droplet-based hydraulic erosion, extracted from HydraulicErosionFormula so it
 * can run as a pipeline node (field -> heightmap). Classic Beyer / Lague model:
 * https://www.firespark.de/resources/downloads/implementation%20of%20a%20methode%20for%20hydraulic%20erosion.pdf
 */

/**
 * Canonical default world footprint: a square in x,z centred on the origin.
 * Bake nodes expose this as an adjustable `world size` param; everything that
 * still needs a fixed extent (raw-field previews, tile→field mapping) uses this
 * default.
 */
export const DEFAULT_WORLD_SIZE = 50;

/** Bounds POJO for a centred square world of the given size. */
export function worldBounds(size: number = DEFAULT_WORLD_SIZE): {
  minX: number;
  minZ: number;
  size: number;
} {
  return { minX: -size / 2, minZ: -size / 2, size };
}

const INERTIA = 0.05;
const CAPACITY_FACTOR = 4;
const MIN_CAPACITY = 0.01;
const DROPLET_LIFETIME = 30;
const GRAVITY = 4;
const BRUSH_RADIUS = 2;

export interface ErosionParams {
  seed: number;
  iterations: number;
  erosionRate: number;
  depositionRate: number;
  evaporationRate: number;
}

/** Sample a field onto a res x res grid over a centred square world. */
export function materializeField(
  sample: (x: number, y: number, z: number) => number,
  res: number,
  worldSize: number = DEFAULT_WORLD_SIZE,
): Float32Array {
  const heights = new Float32Array(res * res);
  const min = -worldSize / 2;
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const worldX = min + (x / (res - 1)) * worldSize;
      const worldZ = min + (y / (res - 1)) * worldSize;
      heights[y * res + x] = sample(worldX, 0, worldZ);
    }
  }
  return heights;
}

/** Bilinear height lookup, clamped to the grid. */
export function sampleHeightGrid(
  heights: Float32Array,
  res: number,
  u: number,
  v: number,
): number {
  const cu = Math.min(Math.max(u, 0), res - 1);
  const cv = Math.min(Math.max(v, 0), res - 1);
  const x0 = Math.floor(cu);
  const y0 = Math.floor(cv);
  const x1 = Math.min(x0 + 1, res - 1);
  const y1 = Math.min(y0 + 1, res - 1);
  const fx = cu - x0;
  const fy = cv - y0;

  const h00 = heights[y0 * res + x0];
  const h10 = heights[y0 * res + x1];
  const h01 = heights[y1 * res + x0];
  const h11 = heights[y1 * res + x1];

  return (
    h00 * (1 - fx) * (1 - fy) +
    h10 * fx * (1 - fy) +
    h01 * (1 - fx) * fy +
    h11 * fx * fy
  );
}

export function erode(
  heights: Float32Array,
  res: number,
  params: Partial<ErosionParams>,
): void {
  const iterations = Math.round(params.iterations ?? 0);
  if (iterations <= 0) return;

  const erosionRate = params.erosionRate ?? 0.3;
  const depositionRate = params.depositionRate ?? 0.3;
  const evaporationRate = params.evaporationRate ?? 0.02;
  const seed = params.seed ?? 42;

  // Seeded PRNG so the same params always give the same rain.
  let s = Math.floor(seed * 7919 + 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  // Precompute the erosion brush: a normalised falloff disc.
  const brushDX: number[] = [];
  const brushDY: number[] = [];
  const brushW: number[] = [];
  let brushSum = 0;
  for (let by = -BRUSH_RADIUS; by <= BRUSH_RADIUS; by++) {
    for (let bx = -BRUSH_RADIUS; bx <= BRUSH_RADIUS; bx++) {
      const d = Math.sqrt(bx * bx + by * by);
      if (d > BRUSH_RADIUS) continue;
      brushDX.push(bx);
      brushDY.push(by);
      brushW.push(1 - d / BRUSH_RADIUS);
      brushSum += 1 - d / BRUSH_RADIUS;
    }
  }
  for (let i = 0; i < brushW.length; i++) brushW[i] /= brushSum;

  const sampleHG = (px: number, py: number) => {
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const fx = px - x0;
    const fy = py - y0;
    const x1 = Math.min(x0 + 1, res - 1);
    const y1 = Math.min(y0 + 1, res - 1);

    const h00 = heights[y0 * res + x0];
    const h10 = heights[y0 * res + x1];
    const h01 = heights[y1 * res + x0];
    const h11 = heights[y1 * res + x1];

    const height =
      h00 * (1 - fx) * (1 - fy) +
      h10 * fx * (1 - fy) +
      h01 * (1 - fx) * fy +
      h11 * fx * fy;
    const gradX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
    const gradY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;
    return { height, gradX, gradY };
  };

  for (let iter = 0; iter < iterations; iter++) {
    let posX = rand() * (res - 1);
    let posY = rand() * (res - 1);
    let dirX = 0;
    let dirY = 0;
    let speed = 1;
    let water = 1;
    let sediment = 0;

    for (let life = 0; life < DROPLET_LIFETIME; life++) {
      const nodeX = Math.floor(posX);
      const nodeY = Math.floor(posY);
      const cellX = posX - nodeX;
      const cellY = posY - nodeY;

      const { height: oldHeight, gradX, gradY } = sampleHG(posX, posY);

      dirX = dirX * INERTIA - gradX * (1 - INERTIA);
      dirY = dirY * INERTIA - gradY * (1 - INERTIA);
      const len = Math.hypot(dirX, dirY);
      if (len !== 0) {
        dirX /= len;
        dirY /= len;
      } else {
        const a = rand() * Math.PI * 2;
        dirX = Math.cos(a);
        dirY = Math.sin(a);
      }

      posX += dirX;
      posY += dirY;

      if (posX < 0 || posX >= res - 1 || posY < 0 || posY >= res - 1) break;

      const newHeight = sampleHG(posX, posY).height;
      const deltaHeight = newHeight - oldHeight;

      const capacity = Math.max(
        -deltaHeight * speed * water * CAPACITY_FACTOR,
        MIN_CAPACITY,
      );

      if (sediment > capacity || deltaHeight > 0) {
        const amount =
          deltaHeight > 0
            ? Math.min(deltaHeight, sediment)
            : (sediment - capacity) * depositionRate;
        sediment -= amount;

        heights[nodeY * res + nodeX] += amount * (1 - cellX) * (1 - cellY);
        heights[nodeY * res + nodeX + 1] += amount * cellX * (1 - cellY);
        heights[(nodeY + 1) * res + nodeX] += amount * (1 - cellX) * cellY;
        heights[(nodeY + 1) * res + nodeX + 1] += amount * cellX * cellY;
      } else {
        const amount = Math.min(
          (capacity - sediment) * erosionRate,
          -deltaHeight,
        );
        let removed = 0;
        for (let i = 0; i < brushW.length; i++) {
          const bx = nodeX + brushDX[i];
          const by = nodeY + brushDY[i];
          if (bx < 0 || bx >= res || by < 0 || by >= res) continue;
          const w = amount * brushW[i];
          heights[by * res + bx] -= w;
          removed += w;
        }
        sediment += removed;
      }

      speed = Math.sqrt(Math.max(0, speed * speed + deltaHeight * GRAVITY));
      water *= 1 - evaporationRate;
      if (water < 1e-4) break;
    }
  }
}
