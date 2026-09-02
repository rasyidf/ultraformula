import * as THREE from "three";
import type { Formula, FormulaParams } from "~/types/Formula";
import { geometryDataFromBufferGeometry } from "~/lib/pipeline/geometryThree";
import type { GeometryData } from "~/lib/pipeline/types";
import { MarchingCubes } from "./MarchingCubes";

/**
 * The parametric formulas (Gielis, Torus, …) build their display mesh with THREE
 * (`Vector3` maths, `BufferGeometry`). That code used to live on the formula
 * classes, which pulled `three` into the graph-evaluation Worker bundle even
 * though the Worker never renders. It now lives here — imported only by
 * `payloadToFormula` on the main thread — and each builder returns a plain
 * `GeometryData` so the rest of the pipeline stays THREE-free.
 *
 * Bodies are moved verbatim from the old `*.Formula.createGeometry`; `this` is
 * passed in as `formula`.
 */

type Builder = (formula: Formula, params: FormulaParams) => THREE.BufferGeometry;

function gielisColor(uv: { u: number; v: number }): THREE.Color {
  const hue = uv.u;
  const saturation = 0.7 + Math.sin(uv.v * Math.PI) * 0.2;
  const lightness = 0.5 + Math.cos(uv.v * Math.PI * 2) * 0.2;
  return new THREE.Color().setHSL(hue, saturation, lightness);
}

function mobiusColor(uv: { u: number; v: number }): THREE.Color {
  const hue = uv.u;
  const saturation = 0.8;
  const lightness = 0.4 + uv.v * 0.4;
  return new THREE.Color().setHSL(hue, saturation, lightness);
}

const buildGielis: Builder = (formula, params) => {
  const segments = 180;
  const rings = 180;
  const maxPhi = Math.PI * 2;
  const maxTheta = Math.PI;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  for (let ring = 0; ring <= rings; ring++) {
    const theta = (ring / rings) * maxTheta;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let segment = 0; segment <= segments; segment++) {
      const phi = (segment / segments) * maxPhi;

      params.phi = phi;
      const r = formula.calculate(params);

      const x = r * sinTheta * Math.cos(phi);
      const y = r * cosTheta;
      const z = r * sinTheta * Math.sin(phi);

      vertices.push(x, y, z);

      const normal = new THREE.Vector3(x, y, z).normalize();
      normals.push(normal.x, normal.y, normal.z);

      const u = segment / segments;
      const v = ring / rings;
      uvs.push(u, v);

      const color = gielisColor({ u, v });
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const first = ring * (segments + 1) + segment;
      const second = first + segments + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const buildTorus: Builder = (_formula, params) => {
  const { majorRadius, minorRadius, twists, waviness } = params;
  const segments = 128;
  const tubes = 64;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;

    for (let j = 0; j <= tubes; j++) {
      const v = (j / tubes) * Math.PI * 2;

      const twistAngle = (i / segments) * twists * Math.PI * 2;
      const vTwisted = v + twistAngle;

      const waveOffset = Math.sin(u * 4) * Math.cos(v * 3) * waviness;
      const effectiveMinorRadius = minorRadius + waveOffset;

      const x = (majorRadius + effectiveMinorRadius * Math.cos(vTwisted)) * Math.cos(u);
      const y = (majorRadius + effectiveMinorRadius * Math.cos(vTwisted)) * Math.sin(u);
      const z = effectiveMinorRadius * Math.sin(vTwisted);

      vertices.push(x, y, z);

      const centerX = majorRadius * Math.cos(u);
      const centerY = majorRadius * Math.sin(u);
      const normal = new THREE.Vector3(x - centerX, y - centerY, z).normalize();
      normals.push(normal.x, normal.y, normal.z);

      uvs.push(i / segments, j / tubes);

      const hue = u / (Math.PI * 2);
      const saturation = 0.7;
      const lightness = 0.5 + Math.sin(v) * 0.2;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < tubes; j++) {
      const a = i * (tubes + 1) + j;
      const b = a + tubes + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const buildLissajous: Builder = (_formula, params) => {
  const { A, B, C, a, b, c, delta, tubeRadius } = params;
  const segments = 512;
  const tubularSegments = 24;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  const pathPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = A * Math.sin(a * t + delta);
    const y = B * Math.sin(b * t);
    const z = C * Math.sin(c * t);
    pathPoints.push(new THREE.Vector3(x, y, z));
  }

  for (let i = 0; i < pathPoints.length; i++) {
    const point = pathPoints[i];
    const nextPoint = pathPoints[(i + 1) % pathPoints.length];

    const tangent = new THREE.Vector3().subVectors(nextPoint, point).normalize();

    const arbitrary =
      Math.abs(tangent.y) < 0.99
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, arbitrary).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    for (let j = 0; j <= tubularSegments; j++) {
      const angle = (j / tubularSegments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const x = point.x + tubeRadius * (cos * normal.x + sin * binormal.x);
      const y = point.y + tubeRadius * (cos * normal.y + sin * binormal.y);
      const z = point.z + tubeRadius * (cos * normal.z + sin * binormal.z);

      vertices.push(x, y, z);

      const surfaceNormal = new THREE.Vector3(
        cos * normal.x + sin * binormal.x,
        cos * normal.y + sin * binormal.y,
        cos * normal.z + sin * binormal.z,
      ).normalize();
      normals.push(surfaceNormal.x, surfaceNormal.y, surfaceNormal.z);

      uvs.push(i / segments, j / tubularSegments);

      const t = i / segments;
      const hue = t;
      const saturation = 0.8;
      const lightness = 0.4 + Math.sin(angle) * 0.2;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < pathPoints.length - 1; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a2 = i * (tubularSegments + 1) + j;
      const b2 = a2 + tubularSegments + 1;
      const c2 = a2 + 1;
      const d2 = b2 + 1;
      indices.push(a2, b2, c2);
      indices.push(b2, d2, c2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

function smoothMesh(geometry: THREE.BufferGeometry, iterations: number): void {
  for (let i = 0; i < iterations; i++) {
    const positions = geometry.attributes.position.array as Float32Array;

    const tempPositions = positions.slice();

    for (let j = 0; j < positions.length; j += 9) {
      const centroidX = (positions[j] + positions[j + 3] + positions[j + 6]) / 3;
      const centroidY = (positions[j + 1] + positions[j + 4] + positions[j + 7]) / 3;
      const centroidZ = (positions[j + 2] + positions[j + 5] + positions[j + 8]) / 3;

      const smoothFactor = 0.1;
      for (let k = 0; k < 9; k += 3) {
        tempPositions[j + k] += (centroidX - positions[j + k]) * smoothFactor;
        tempPositions[j + k + 1] += (centroidY - positions[j + k + 1]) * smoothFactor;
        tempPositions[j + k + 2] += (centroidZ - positions[j + k + 2]) * smoothFactor;
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(tempPositions, 3));
    geometry.computeVertexNormals();
  }
}

const buildGyroid: Builder = (formula, params) => {
  const resolution = params.resolution || 30;
  const size = 10;
  const step = (2 * size) / resolution;
  const smoothingIterations = params.smoothing || 0;

  const bufferSize = resolution + 3;
  const grid = new Float32Array(bufferSize * bufferSize * bufferSize);

  for (let x = 0; x < bufferSize; x++) {
    for (let y = 0; y < bufferSize; y++) {
      for (let z = 0; z < bufferSize; z++) {
        const px = -size + (x - 1) * step;
        const py = -size + (y - 1) * step;
        const pz = -size + (z - 1) * step;

        grid[x + y * bufferSize + z * bufferSize * bufferSize] = formula.calculate({
          ...params,
          x: px,
          y: py,
          z: pz,
        });
      }
    }
  }

  const vertices: number[] = [];
  const normals: number[] = [];

  const marchingCubes = new MarchingCubes();
  marchingCubes.generateGeometry(
    grid,
    resolution,
    size,
    step,
    vertices,
    normals,
    bufferSize,
  );

  const { vertices: unifiedVerts, normals: unifiedNorms } =
    marchingCubes.unifyVertices(vertices, normals);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(unifiedVerts, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(unifiedNorms, 3));

  if (smoothingIterations > 0) {
    smoothMesh(geometry, smoothingIterations);
  }

  return geometry;
};

const buildMobius: Builder = (_formula, params) => {
  const { radius, width, twist } = params;
  const segments = 100;
  const sides = 20;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const angle = u * Math.PI * 2;

    for (let j = 0; j <= sides; j++) {
      const v = j / sides;
      const w = v - 0.5;

      const x = (radius + w * width * Math.cos((twist * angle) / 2)) * Math.cos(angle);
      const y = (radius + w * width * Math.cos((twist * angle) / 2)) * Math.sin(angle);
      const z = w * width * Math.sin((twist * angle) / 2);

      vertices.push(x, z, y);

      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const nz = 0;

      normals.push(nx, nz, ny);

      uvs.push(u, v);

      const color = mobiusColor({ u, v });
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j;
      const b = a + 1;
      const c = a + (sides + 1);
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const buildKleinBottle: Builder = (_formula, params) => {
  const { scale, complexity, twist, thickness } = params;
  const segments = 128;
  const tubes = 64;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;

    for (let j = 0; j <= tubes; j++) {
      const v = (j / tubes) * Math.PI * 2;

      const r = 4 * (1 - Math.cos(u) / 2);
      let x: number;
      let y: number;
      let z: number;

      if (u < Math.PI) {
        x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.cos(u * twist);
        y = 16 * Math.sin(u);
        z = r * Math.sin(v + Math.PI);
      } else {
        x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.cos(u * twist);
        y = 16 * Math.sin(u);
        z = r * Math.sin(v);
      }

      x *= scale * 0.1 * complexity;
      y *= scale * 0.1 * complexity;
      z *= scale * 0.1 * thickness;

      vertices.push(x, y, z);

      const epsilon = 0.001;
      let x1: number;
      let y1: number;
      let z1: number;
      const u1 = u + epsilon;
      const r1 = 4 * (1 - Math.cos(u1) / 2);

      if (u1 < Math.PI) {
        x1 = 6 * Math.cos(u1) * (1 + Math.sin(u1)) + r1 * Math.cos(v + Math.PI) * Math.cos(u1 * twist);
        y1 = 16 * Math.sin(u1);
        z1 = r1 * Math.sin(v + Math.PI);
      } else {
        x1 = 6 * Math.cos(u1) * (1 + Math.sin(u1)) + r1 * Math.cos(v) * Math.cos(u1 * twist);
        y1 = 16 * Math.sin(u1);
        z1 = r1 * Math.sin(v);
      }

      x1 *= scale * 0.1 * complexity;
      y1 *= scale * 0.1 * complexity;
      z1 *= scale * 0.1 * thickness;

      const tangentU = new THREE.Vector3(x1 - x, y1 - y, z1 - z);

      let x2: number;
      let y2: number;
      let z2: number;
      const v1 = v + epsilon;
      if (u < Math.PI) {
        x2 = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v1 + Math.PI) * Math.cos(u * twist);
        y2 = 16 * Math.sin(u);
        z2 = r * Math.sin(v1 + Math.PI);
      } else {
        x2 = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v1) * Math.cos(u * twist);
        y2 = 16 * Math.sin(u);
        z2 = r * Math.sin(v1);
      }

      x2 *= scale * 0.1 * complexity;
      y2 *= scale * 0.1 * complexity;
      z2 *= scale * 0.1 * thickness;

      const tangentV = new THREE.Vector3(x2 - x, y2 - y, z2 - z);
      const normal = tangentU.cross(tangentV).normalize();

      normals.push(normal.x, normal.y, normal.z);

      uvs.push(i / segments, j / tubes);

      const hue = u / (Math.PI * 2);
      const saturation = 0.8;
      const lightness = 0.4 + Math.abs(Math.sin(v)) * 0.3;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < tubes; j++) {
      const a = i * (tubes + 1) + j;
      const b = a + tubes + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const buildRoseCurve: Builder = (_formula, params) => {
  const { n, d, amplitude, depth, twist } = params;
  const angularSegments = 360;
  const depthSegments = 32;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  const k = n / d;

  for (let i = 0; i <= depthSegments; i++) {
    const z = (i / depthSegments - 0.5) * depth * 2;
    const twistAngle = (i / depthSegments) * twist * Math.PI * 2;

    for (let j = 0; j <= angularSegments; j++) {
      const angle = (j / angularSegments) * Math.PI * 2;
      const r = amplitude * Math.abs(Math.cos(k * angle));

      const rotatedAngle = angle + twistAngle;
      const x = r * Math.cos(rotatedAngle);
      const y = r * Math.sin(rotatedAngle);

      vertices.push(x, y, z);

      const normal = new THREE.Vector3(x, y, 0).normalize();
      normals.push(normal.x, normal.y, normal.z);

      uvs.push(j / angularSegments, i / depthSegments);

      const petalIndex = Math.floor((angle / (Math.PI * 2)) * (n % 2 === 0 ? 2 * n : n));
      const hue = (petalIndex / (n % 2 === 0 ? 2 * n : n)) % 1;
      const saturation = 0.7 + Math.sin(angle * k) * 0.2;
      const lightness = 0.5 + (i / depthSegments) * 0.3;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < depthSegments; i++) {
    for (let j = 0; j < angularSegments; j++) {
      const a = i * (angularSegments + 1) + j;
      const b = a + angularSegments + 1;
      const c = a + 1;
      const d2 = b + 1;
      indices.push(a, b, c);
      indices.push(b, d2, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const buildSineInterference: Builder = (formula, params) => {
  const segments = 128;
  const rings = 128;
  const maxPhi = Math.PI * 2;
  const maxTheta = Math.PI;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let ring = 0; ring <= rings; ring++) {
    const theta = (ring / rings) * maxTheta;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let segment = 0; segment <= segments; segment++) {
      const phi = (segment / segments) * maxPhi;

      const r = formula.calculate({ ...params, phi, theta });

      const x = r * sinTheta * Math.cos(phi);
      const y = r * cosTheta;
      const z = r * sinTheta * Math.sin(phi);

      vertices.push(x, y, z);

      const normal = new THREE.Vector3(x, y, z).normalize();
      normals.push(normal.x, normal.y, normal.z);

      const u = segment / segments;
      const v = ring / rings;
      uvs.push(u, v);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const first = ring * (segments + 1) + segment;
      const second = first + segments + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
};

const buildCartesianSine: Builder = (_formula, params) => {
  const { amplitude, frequency, phase } = params;
  const segments = 128;
  const rings = 64;
  const tubeRadius = 0.1;
  const maxPhi = Math.PI * 2;

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let ring = 0; ring <= rings; ring++) {
    const theta = (ring / rings) * maxPhi;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let segment = 0; segment <= segments; segment++) {
      const phi = (segment / segments) * maxPhi;

      const x = Math.cos(phi);
      const z = Math.sin(phi);
      const y = amplitude * Math.sin(frequency * phi + phase);

      const nx = tubeRadius * cosTheta * x - tubeRadius * sinTheta * z;
      const nz = tubeRadius * sinTheta * x + tubeRadius * cosTheta * z;

      vertices.push(nx, y + tubeRadius * cosTheta, nz);

      const normal = new THREE.Vector3(nx - x, tubeRadius * cosTheta, nz - z).normalize();
      normals.push(normal.x, normal.y, normal.z);

      const u = segment / segments;
      const v = ring / rings;
      uvs.push(u, v);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const first = ring * (segments + 1) + segment;
      const second = first + segments + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
};

/** Keyed by `formulaRegistry` key. */
const BUILDERS: Record<string, Builder> = {
  gielis: buildGielis,
  torus: buildTorus,
  lissajous: buildLissajous,
  gyroid: buildGyroid,
  mobius: buildMobius,
  kleinBottle: buildKleinBottle,
  roseCurve: buildRoseCurve,
  sineInterference: buildSineInterference,
  cartesianSine: buildCartesianSine,
};

/** Build a formula's display mesh as plain `GeometryData`, or `null` if it has none. */
export function buildParametricGeometry(
  key: string,
  formula: Formula,
  params: FormulaParams,
): GeometryData | null {
  const build = BUILDERS[key];
  if (!build) return null;
  return geometryDataFromBufferGeometry(build(formula, { ...params }));
}
