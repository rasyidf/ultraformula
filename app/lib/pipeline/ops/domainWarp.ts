import { PerlinNoise } from "~/lib/formulas/noises/PerlinNoise";

export interface DomainWarpParams {
  warpStrength: number;
  warpScale: number;
  seed: number;
  warpOctaves: number;
}

/**
 * Domain warping: displace each sample coordinate by the output of a Perlin warp
 * field before reading the wrapped field. See DomainWarpFormula / iquilezles.org.
 */
export function domainWarp(
  sample: (x: number, y: number, z: number) => number,
  params: Partial<DomainWarpParams>,
): (x: number, y: number, z: number) => number {
  const warpStrength = params.warpStrength ?? 1.2;
  const warpScale = params.warpScale ?? 0.5;
  const seed = params.seed ?? 42;
  const octaves = Math.max(1, Math.round(params.warpOctaves ?? 4));

  const fbm = (x: number, y: number, z: number) =>
    PerlinNoise.calculate(x, y, z, octaves, 0.5, 2, seed);

  return (x, y, z) => {
    const wx = x * warpScale;
    const wy = y * warpScale;
    const wz = z * warpScale;
    const qx = fbm(wx, wy, wz);
    const qy = fbm(wx + 5.2, wy + 1.3, wz + 2.8);
    const qz = fbm(wx + 1.7, wy + 9.2, wz + 3.4);
    return sample(
      x + warpStrength * qx,
      y + warpStrength * qy,
      z + warpStrength * qz,
    );
  };
}
