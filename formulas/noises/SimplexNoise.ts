
export class SimplexNoise {
  private static grad3: Array<[number, number, number]> = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];
  private static p: Array<number> = [];
  private static perm: Array<number> = [];
  private static gradP: Array<number> = [];

  static initialize(seed: number) {
    this.p = [];
    this.perm = [];
    this.gradP = [];

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    for (let i = 255; i > 0; i--) {
      const n = Math.floor((i + 1) * random());
      const q = this.p[i];
      this.p[i] = this.p[n];
      this.p[n] = q;
    }

    for (let i = 0; i < 256; i++) {
      this.perm[i] = this.p[i];
      this.perm[i + 256] = this.p[i];
    }

    for (let i = 0; i < 512; i++) {
      this.gradP[i] = this.perm[i % 256] % 12;
    }
  }

  static dot(g: [number, number, number], x: number, y: number) {
    return g[0] * x + g[1] * y;
  }

  static noise2D(xin: number, yin: number) {
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    let n0, n1, n2;
    const s = (xin + yin) * 0.5 * (Math.sqrt(3.0) - 1.0);
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.gradP[ii + this.perm[jj]];
    const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;

    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;

    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }
}
