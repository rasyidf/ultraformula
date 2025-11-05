

/**
 * SmoothingHelper provides mesh smoothing algorithms for 3D geometry.
 * Supports both vertex position smoothing and normal smoothing.
 */
export class SmoothingHelper {
    /**
     * Build a vertex adjacency map for efficient neighbor lookups.
     * Uses a spatial hash grid for O(n) performance instead of O(n²).
     * 
     * @param vertices Flat array of vertex positions [x1, y1, z1, x2, y2, z2, ...]
     * @param threshold Distance threshold for considering vertices as neighbors
     * @returns Map from vertex index to array of neighbor indices
     */
    static buildAdjacencyMap(vertices: number[], threshold: number = 0.01): Map<number, number[]> {
        const adjacencyMap = new Map<number, number[]>();
        const vertexCount = vertices.length / 3;
        
        // Build spatial hash for fast neighbor finding
        const cellSize = threshold * 2;
        const spatialHash = new Map<string, number[]>();
        
        // Hash all vertices into grid cells
        for (let i = 0; i < vertexCount; i++) {
            const x = vertices[i * 3];
            const y = vertices[i * 3 + 1];
            const z = vertices[i * 3 + 2];
            
            const cellX = Math.floor(x / cellSize);
            const cellY = Math.floor(y / cellSize);
            const cellZ = Math.floor(z / cellSize);
            const key = `${cellX},${cellY},${cellZ}`;
            
            if (!spatialHash.has(key)) {
                spatialHash.set(key, []);
            }
            spatialHash.get(key)!.push(i);
        }
        
        // Find neighbors for each vertex by checking nearby cells
        for (let i = 0; i < vertexCount; i++) {
            const neighbors: number[] = [];
            const x = vertices[i * 3];
            const y = vertices[i * 3 + 1];
            const z = vertices[i * 3 + 2];
            
            const cellX = Math.floor(x / cellSize);
            const cellY = Math.floor(y / cellSize);
            const cellZ = Math.floor(z / cellSize);
            
            // Check this cell and all 26 neighboring cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                        const cellVertices = spatialHash.get(key);
                        
                        if (cellVertices) {
                            for (const j of cellVertices) {
                                if (i !== j) {
                                    const dx = vertices[j * 3] - x;
                                    const dy = vertices[j * 3 + 1] - y;
                                    const dz = vertices[j * 3 + 2] - z;
                                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                                    
                                    if (dist < threshold) {
                                        neighbors.push(j);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            adjacencyMap.set(i, neighbors);
        }
        
        return adjacencyMap;
    }

    /**
     * Apply Laplacian smoothing to vertex positions.
     * Blends each vertex position with the average of its neighbors.
     * 
     * @param vertices Flat array of vertex positions [x1, y1, z1, x2, y2, z2, ...]
     * @param iterations Number of smoothing iterations
     * @param lambda Smoothing factor (0-1). Higher values = more smoothing. Default: 0.5
     * @param threshold Distance threshold for neighbor detection. Auto-calculated if not provided.
     * @returns Smoothed vertex array
     */
    static laplacian(
        vertices: number[], 
        iterations: number = 1, 
        lambda: number = 0.5,
        threshold?: number
    ): number[] {
        if (iterations <= 0) return vertices.slice();
        
        const vertexCount = vertices.length / 3;
        if (vertexCount === 0) return vertices.slice();
        
        // Auto-calculate threshold based on average edge length if not provided
        if (threshold === undefined) {
            threshold = this.calculateAverageEdgeLength(vertices) * 1.5;
        }
        
        // Build adjacency map once for all iterations
        const adjacencyMap = this.buildAdjacencyMap(vertices, threshold);
        
        let current = vertices.slice();
        const temp = new Float32Array(vertices.length);
        
        for (let iter = 0; iter < iterations; iter++) {
            // Copy current to temp
            temp.set(current);
            
            // Smooth each vertex
            for (let i = 0; i < vertexCount; i++) {
                const neighbors = adjacencyMap.get(i);
                
                if (!neighbors || neighbors.length === 0) {
                    continue;
                }
                
                // Calculate average position of neighbors
                let avgX = 0, avgY = 0, avgZ = 0;
                for (const neighborIdx of neighbors) {
                    avgX += current[neighborIdx * 3];
                    avgY += current[neighborIdx * 3 + 1];
                    avgZ += current[neighborIdx * 3 + 2];
                }
                
                avgX /= neighbors.length;
                avgY /= neighbors.length;
                avgZ /= neighbors.length;
                
                // Blend current position with average (Laplacian smoothing)
                const currentX = current[i * 3];
                const currentY = current[i * 3 + 1];
                const currentZ = current[i * 3 + 2];
                
                temp[i * 3] = currentX + lambda * (avgX - currentX);
                temp[i * 3 + 1] = currentY + lambda * (avgY - currentY);
                temp[i * 3 + 2] = currentZ + lambda * (avgZ - currentZ);
            }
            
            // Swap buffers
            current = Array.from(temp);
        }
        
        return current;
    }

    /**
     * Smooth normal vectors while preserving their unit length.
     * 
     * @param vertices Flat array of vertex positions (used for neighbor detection)
     * @param normals Flat array of normal vectors [nx1, ny1, nz1, nx2, ny2, nz2, ...]
     * @param iterations Number of smoothing iterations
     * @param threshold Distance threshold for neighbor detection
     * @returns Smoothed and normalized normal array
     */
    static smoothNormals(
        vertices: number[], 
        normals: number[], 
        iterations: number = 1,
        threshold?: number
    ): number[] {
        if (iterations <= 0) return normals.slice();
        
        const vertexCount = vertices.length / 3;
        if (vertexCount === 0 || normals.length !== vertices.length) {
            return normals.slice();
        }
        
        // Auto-calculate threshold if not provided
        if (threshold === undefined) {
            threshold = this.calculateAverageEdgeLength(vertices) * 1.5;
        }
        
        // Build adjacency map once
        const adjacencyMap = this.buildAdjacencyMap(vertices, threshold);
        
        let current = normals.slice();
        const temp = new Float32Array(normals.length);
        
        for (let iter = 0; iter < iterations; iter++) {
            temp.set(current);
            
            for (let i = 0; i < vertexCount; i++) {
                const neighbors = adjacencyMap.get(i);
                
                if (!neighbors || neighbors.length === 0) {
                    continue;
                }
                
                // Average normals from neighbors
                let avgX = current[i * 3];
                let avgY = current[i * 3 + 1];
                let avgZ = current[i * 3 + 2];
                
                for (const neighborIdx of neighbors) {
                    avgX += current[neighborIdx * 3];
                    avgY += current[neighborIdx * 3 + 1];
                    avgZ += current[neighborIdx * 3 + 2];
                }
                
                // Normalize the averaged normal
                const length = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
                if (length > 0.0001) {
                    temp[i * 3] = avgX / length;
                    temp[i * 3 + 1] = avgY / length;
                    temp[i * 3 + 2] = avgZ / length;
                }
            }
            
            current = Array.from(temp);
        }
        
        return current;
    }

    /**
     * Calculate average edge length in the mesh for automatic threshold determination.
     * Samples a subset of edges for performance.
     * 
     * @param vertices Flat array of vertex positions
     * @returns Average edge length
     */
    private static calculateAverageEdgeLength(vertices: number[]): number {
        const vertexCount = vertices.length / 3;
        if (vertexCount < 2) return 0.1;
        
        // Sample up to 1000 vertex pairs to estimate average edge length
        const sampleCount = Math.min(1000, vertexCount);
        let totalDistance = 0;
        let count = 0;
        
        for (let i = 0; i < sampleCount; i++) {
            const idx1 = Math.floor(Math.random() * vertexCount);
            const idx2 = Math.floor(Math.random() * vertexCount);
            
            if (idx1 !== idx2) {
                const dx = vertices[idx2 * 3] - vertices[idx1 * 3];
                const dy = vertices[idx2 * 3 + 1] - vertices[idx1 * 3 + 1];
                const dz = vertices[idx2 * 3 + 2] - vertices[idx1 * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                totalDistance += dist;
                count++;
            }
        }
        
        return count > 0 ? totalDistance / count : 0.1;
    }

    /**
     * Calculate distance between two 3D points.
     * 
     * @param a First point [x, y, z]
     * @param b Second point [x, y, z]
     * @returns Euclidean distance
     */
    static distance(a: number[], b: number[]): number {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}