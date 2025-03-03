import * as THREE from "three";

export class MarchingCubes {
  generateGeometry(
    grid: Float32Array,
    resolution: number,
    size: number,
    step: number,
    vertices: number[],
    normals: number[],
    bufferSize?: number
  ): void {
    const gridSize = bufferSize || resolution + 1;

    for (let x = 0; x < resolution; x++) {
      for (let y = 0; y < resolution; y++) {
        for (let z = 0; z < resolution; z++) {
          const cubeIndex = this.getCubeIndex(x, y, z, gridSize, grid);
          if (cubeIndex === 0 || cubeIndex === 255) continue;

          const edges = this.getEdges(cubeIndex);
          const vertList: THREE.Vector3[] = [];

          for (let i = 0; i < 12; i++) {
            if (edges & (1 << i)) {
              const v1 = this.getEdgePoint(i, x, y, z, gridSize, step, size, grid);
              vertList.push(v1);
            }
          }

          for (let i = 0; i <= vertList.length - 3; i += 3) {
            const v1 = vertList[i];
            const v2 = vertList[i + 1];
            const v3 = vertList[i + 2];

            // Calculate the normal using cross product
            const edge1 = new THREE.Vector3().subVectors(v2, v1);
            const edge2 = new THREE.Vector3().subVectors(v3, v1);
            const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

            vertices.push(v1.x, v1.y, v1.z);
            vertices.push(v2.x, v2.y, v2.z);
            vertices.push(v3.x, v3.y, v3.z);

            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);
          }
        }
      }
    }
  }

  private getCubeIndex(x: number, y: number, z: number, gridSize: number, grid: Float32Array): number {
    let cubeIndex = 0;
    for (let i = 0; i < 8; i++) {
      const dx = i & 1;
      const dy = (i >> 1) & 1;
      const dz = (i >> 2) & 1;
      const idx = (x + dx) + (y + dy) * gridSize + (z + dz) * gridSize * gridSize;
      if (grid[idx] <= 0) cubeIndex |= 1 << i;
    }
    return cubeIndex;
  }

  private getEdges(cubeIndex: number): number {
    // Lookup table for edges (12 edges per cube)
    const edgeTable = [
      0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
      0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
      0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
      0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
      0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
      0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
      0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
      0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
      0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
      0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
      0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
      0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
      0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
      0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
      0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
      0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0,
    ];
    return edgeTable[cubeIndex];
  }

  private getEdgePoint(
    edge: number,
    x: number,
    y: number,
    z: number,
    gridSize: number,
    step: number,
    size: number,
    grid: Float32Array
  ): THREE.Vector3 {
    const edgeToVerts = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    const vertToPos = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ];

    const [v1, v2] = edgeToVerts[edge];
    const p1 = vertToPos[v1];
    const p2 = vertToPos[v2];

    const idx1 = (x + p1[0]) + (y + p1[1]) * gridSize + (z + p1[2]) * gridSize * gridSize;
    const idx2 = (x + p2[0]) + (y + p2[1]) * gridSize + (z + p2[2]) * gridSize * gridSize;

    const val1 = grid[idx1];
    const val2 = grid[idx2];

    const t = val1 / (val1 - val2);

    const px = x + p1[0] + t * (p2[0] - p1[0]);
    const py = y + p1[1] + t * (p2[1] - p1[1]);
    const pz = z + p1[2] + t * (p2[2] - p1[2]);

    return new THREE.Vector3(
      -size + px * step,
      -size + py * step,
      -size + pz * step
    );
  }

  unifyVertices(vertices: number[], normals: number[]): { vertices: number[]; normals: number[] } {
    const vertexMap = new Map<string, { index: number; normal: THREE.Vector3 }>();
    const newVerts: number[] = [];
    const newNorms: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < vertices.length; i += 3) {
      const key = `${vertices[i].toFixed(5)},${vertices[i + 1].toFixed(5)},${vertices[i + 2].toFixed(5)}`;
      
      if (!vertexMap.has(key)) {
        const index = newVerts.length / 3;
        newVerts.push(vertices[i], vertices[i + 1], vertices[i + 2]);
        const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);
        vertexMap.set(key, { index, normal });
        newNorms.push(normal.x, normal.y, normal.z);
      }
    }

    return { vertices: newVerts, normals: newNorms };
  }
}