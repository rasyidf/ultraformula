export class PerlinNoise {
  private static gradients: number[][];
  private static permutation: number[];

  static initialize(seed: number) {
    // Initialize gradient vectors
    this.gradients = [];
    for (let i = 0; i < 256; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      this.gradients.push([
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta)
      ]);
    }

    // Create permutation table
    this.permutation = Array.from({length: 256}, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor((seed * i) % (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
  }

  static calculate(x: number, y: number, z: number, octaves: number, persistence: number, lacunarity: number, seed: number) {
    if (!this.gradients) this.initialize(seed);
    
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize and add turbulence for more interesting terrain
    const normalizedValue = total / maxValue;
    return this.ridgedMultifractal(normalizedValue);
  }

  private static noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x-1, y, z)
        ),
        this.lerp(u,
          this.grad(this.permutation[AB], x, y-1, z),
          this.grad(this.permutation[BB], x-1, y-1, z)
        )
      ),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA+1], x, y, z-1),
          this.grad(this.permutation[BA+1], x-1, y, z-1)
        ),
        this.lerp(u,
          this.grad(this.permutation[AB+1], x, y-1, z-1),
          this.grad(this.permutation[BB+1], x-1, y-1, z-1)
        )
      )
    );
  }

  private static fade(t: number): number {
    // Improved quintic curve for smoother interpolation
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private static grad(hash: number, x: number, y: number, z: number): number {
    const gradient = this.gradients[hash & 255];
    return gradient[0] * x + gradient[1] * y + gradient[2] * z;
  }

  private static ridgedMultifractal(value: number): number {
    // Create more dramatic terrain features
    value = 2 * Math.abs(value - 0.5);
    return value * value;
  }
}
