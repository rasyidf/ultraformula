import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GielisFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gielis",
    description: "A variation of the superformula",
    parameters: {
      a: {
        name: "a",
        description: "First symmetry parameter",
        min: 0.1,
        max: 10,
        step: 0.1,
        isLocked: false
      },
      b: {
        name: "b",
        description: "Second symmetry parameter",
        min: 0.1,
        max: 10,
        step: 0.1,
        isLocked: false
      },
      m: {
        name: "m",
        description: "Rotational symmetry",
        min: 0,
        max: 20,
        step: 1,
        isLocked: false
      },
      n1: {
        name: "n1",
        description: "Overall shape parameter",
        min: 0.1,
        max: 10,
        step: 0.1,
        isLocked: false
      },
      n2: {
        name: "n2",
        description: "Second shape parameter",
        min: 0.1,
        max: 10,
        step: 0.1,
        isLocked: false
      },
      n3: {
        name: "n3",
        description: "Third shape parameter",
        min: 0.1,
        max: 10,
        step: 0.1,
        isLocked: false
      }
    }
  };

  calculate(params: FormulaParams): number {
    const { a, b, m, n1, n2, n3, phi } = params;
    const part1 = Math.abs(Math.cos(m * phi / 4) / a) ** n2;
    const part2 = Math.abs(Math.sin(m * phi / 4) / b) ** n3;
    return (part1 + part2) ** (-1 / n1);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const uRange = { start: -Math.PI, end: Math.PI, step: 0.05 };
    const vRange = { start: -Math.PI / 2, end: Math.PI / 2, step: 0.05 };
    const nu = Math.floor((uRange.end - uRange.start) / uRange.step) + 1;
    const nv = Math.floor((vRange.end - vRange.start) / vRange.step) + 1;

    const vertices = [];
    const indices = [];

    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const u = uRange.start + i * uRange.step;
        const v = vRange.start + j * vRange.step;

        const r1 = this.calculate({ ...params, phi: u });
        const r2 = this.calculate({ ...params, phi: v });

        const x = r1 * Math.cos(u) * r2 * Math.cos(v);
        const y = r1 * Math.sin(u) * r2 * Math.cos(v);
        const z = r2 * Math.sin(v);

        vertices.push(x, y, z);

        if (i < nu - 1 && j < nv - 1) {
          const a = i * nv + j;
          const b = i * nv + j + 1;
          const c = (i + 1) * nv + j;
          const d = (i + 1) * nv + j + 1;

          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }
}
