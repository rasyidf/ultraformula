import * as THREE from "three";
import type { GeometryData } from "./types";

/** Assemble plain-array geometry into a BufferGeometry (main thread only). */
export function bufferGeometryFromData(d: GeometryData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(d.positions, 3),
  );
  if (d.indices) geometry.setIndex(new THREE.BufferAttribute(d.indices, 1));
  if (d.normals) {
    geometry.setAttribute("normal", new THREE.BufferAttribute(d.normals, 3));
  } else {
    geometry.computeVertexNormals();
  }
  if (d.colors) {
    geometry.setAttribute("color", new THREE.BufferAttribute(d.colors, 3));
  }
  return geometry;
}

export function geometryDataFromBufferGeometry(
  g: THREE.BufferGeometry,
): GeometryData {
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const normal = g.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const color = g.getAttribute("color") as THREE.BufferAttribute | undefined;
  const index = g.getIndex();
  return {
    positions: new Float32Array(pos.array),
    normals: normal ? new Float32Array(normal.array) : undefined,
    colors: color ? new Float32Array(color.array) : undefined,
    indices: index ? new Uint32Array(index.array) : undefined,
  };
}
