

export class SmoothingHelper {
    static findNeighbors(index: number, vertices: number[]): number[] {
        const neighbors: number[] = [];
        const vertex = vertices.slice(index * 3, index * 3 + 3);
        for (let i = 0; i < vertices.length / 3; i++) {
            if (i === index) {
                continue;
            }
            const other = vertices.slice(i * 3, i * 3 + 3);
            if (SmoothingHelper.distance(vertex, other) < 0.1) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    static distance(a: number[], b: number[]): number {
        return Math.sqrt(
            (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
        );
    }

    static laplacian(vertices: number[], iterations: number = 1): number[] {
        const smoothed = vertices.slice();
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < vertices.length / 3; j++) {
                // const vertex = vertices.slice(j * 3, j * 3 + 3);
                const neighbors = SmoothingHelper.findNeighbors(j, vertices);
                if (neighbors.length === 0) {
                    continue;
                }
                const average = neighbors.reduce(
                    (acc, index) => {
                        const neighbor = vertices.slice(index * 3, index * 3 + 3);
                        return [acc[0] + neighbor[0], acc[1] + neighbor[1], acc[2] + neighbor[2]];
                    },
                    [0, 0, 0]
                );
                smoothed[j * 3] = average[0] / neighbors.length;
                smoothed[j * 3 + 1] = average[1] / neighbors.length;
                smoothed[j * 3 + 2] = average[2] / neighbors.length;
            }
        }
        return smoothed;
    }

    static smoothNormals(vertices: number[], normals: number[], iterations: number = 1): number[] {
        const smoothed = normals.slice();
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < vertices.length / 3; j++) {
                // const vertex = vertices.slice(j * 3, j * 3 + 3);
                const neighbors = SmoothingHelper.findNeighbors(j, vertices);
                if (neighbors.length === 0) {
                    continue;
                }
                const average = neighbors.reduce(
                    (acc, index) => {
                        return [acc[0] + normals[index * 3], acc[1] + normals[index * 3 + 1], acc[2] + normals[index * 3 + 2]];
                    },
                    [0, 0, 0]
                );
                smoothed[j * 3] = average[0] / neighbors.length;
                smoothed[j * 3 + 1] = average[1] / neighbors.length;
                smoothed[j * 3 + 2] = average[2] / neighbors.length;
            }
        }
        return smoothed;
    }

}