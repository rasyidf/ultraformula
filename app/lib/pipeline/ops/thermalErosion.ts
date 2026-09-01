/**
 * Thermal (talus) erosion: material on slopes steeper than the talus angle
 * slides downhill until the slope relaxes. Cheap, grid-based, complements the
 * droplet-based hydraulic sim with rounded scree slopes and flatter valley
 * floors.
 */
export interface ThermalParams {
  iterations: number;
  talus: number;
  strength: number;
}

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function thermalErode(
  heights: Float32Array,
  res: number,
  params: Partial<ThermalParams>,
): void {
  const iterations = Math.max(0, Math.round(params.iterations ?? 30));
  const talus = params.talus ?? 0.5;
  const strength = Math.min(1, Math.max(0, params.strength ?? 0.5));
  if (iterations === 0 || strength === 0) return;

  const prev = new Float32Array(heights.length);
  const excess = new Float32Array(NEIGHBORS.length);

  for (let it = 0; it < iterations; it++) {
    prev.set(heights);
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const idx = y * res + x;
        const h = prev[idx];
        let total = 0;
        let maxExcess = 0;
        for (let k = 0; k < NEIGHBORS.length; k++) {
          const nx = x + NEIGHBORS[k][0];
          const ny = y + NEIGHBORS[k][1];
          let e = 0;
          if (nx >= 0 && nx < res && ny >= 0 && ny < res) {
            const d = h - prev[ny * res + nx];
            if (d > talus) e = d - talus;
          }
          excess[k] = e;
          total += e;
          if (e > maxExcess) maxExcess = e;
        }
        if (total <= 0) continue;

        const move = strength * 0.5 * maxExcess;
        heights[idx] -= move;
        for (let k = 0; k < NEIGHBORS.length; k++) {
          if (excess[k] <= 0) continue;
          const nx = x + NEIGHBORS[k][0];
          const ny = y + NEIGHBORS[k][1];
          heights[ny * res + nx] += move * (excess[k] / total);
        }
      }
    }
  }
}
