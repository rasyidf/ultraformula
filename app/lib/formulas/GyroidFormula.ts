import * as THREE from "three";
import { BaseFormula } from "./BaseFormula";
import { MarchingCubes } from "./MarchingCubes";
import type { FormulaMetadata, FormulaParams } from "~/types/Formula";

export class GyroidFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "Gyroid",
    description: "Triply periodic minimal surface",
    supportedDimensions: ['3d'],
    parameters: {
      scale: {
        name: "Scale",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 0.2,
        description: "Structure density",
        isLocked: false,
      },
      threshold: {
        name: "Threshold",
        min: -1.5,
        max: 1.5,
        step: 0.1,
        default: 0.0, // Changed from 2.0 to 0.0 for better results
        description: "Surface boundary",
        isLocked: false,
      },
      resolution: {
        name: "Resolution",
        min: 10,
        max: 100,
        step: 1,
        default: 30,
        description: "Grid resolution",
        isLocked: false,
      },
      smoothing: {
        name: "Smoothing",
        min: 0,
        max: 3,
        step: 1,
        default: 1,
        description: "Surface smoothness",
        isLocked: false,
      }
    },
  };

  calculate(params: FormulaParams): number {
    const { x, y, z, scale, threshold } = params;
    const scaledX = (x || 0) * scale;
    const scaledY = (y || 0) * scale;
    const scaledZ = (z || 0) * scale;
    
    // The standard gyroid formula with proper threshold handling
    return (
      Math.sin(scaledX) * Math.cos(scaledY) +
      Math.sin(scaledY) * Math.cos(scaledZ) +
      Math.sin(scaledZ) * Math.cos(scaledX) -
      (threshold || 0)
    );
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    const resolution = params.resolution || 30;
    const size = 10;
    const step = (2 * size) / resolution;
    const smoothingIterations = params.smoothing || 0;

    // Use a buffer size slightly larger than resolution to avoid edge artifacts
    const bufferSize = resolution + 3;
    const grid = new Float32Array(bufferSize * bufferSize * bufferSize);
    
    // Generate grid values with proper sampling
    for (let x = 0; x < bufferSize; x++) {
      for (let y = 0; y < bufferSize; y++) {
        for (let z = 0; z < bufferSize; z++) {
          const px = -size + (x - 1) * step;
          const py = -size + (y - 1) * step;
          const pz = -size + (z - 1) * step;
          
          grid[x + y * bufferSize + z * bufferSize * bufferSize] =
            this.calculate({ ...params, x: px, y: py, z: pz });
        }
      }
    }

    const vertices: number[] = [];
    const normals: number[] = [];

    // Use the improved MarchingCubes implementation
    const marchingCubes = new MarchingCubes();
    marchingCubes.generateGeometry(
      grid,
      resolution,
      size,
      step,
      vertices,
      normals,
      bufferSize
    );

    // Unify vertices to reduce mesh size and improve quality
    const { vertices: unifiedVerts, normals: unifiedNorms } = 
      marchingCubes.unifyVertices(vertices, normals);

    // Create the final geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(unifiedVerts, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(unifiedNorms, 3));
    
    // Apply mesh smoothing if requested
    if (smoothingIterations > 0) {
      this.smoothMesh(geometry, smoothingIterations);
    }

    return geometry;
  }
  
  // Add mesh smoothing to reduce spikes
  private smoothMesh(geometry: THREE.BufferGeometry, iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      const positions = geometry.attributes.position.array as Float32Array;
      const normals = geometry.attributes.normal.array as Float32Array;
      
      // Create a temporary copy of positions
      const tempPositions = positions.slice();
      
      // Simple Laplacian smoothing
      for (let j = 0; j < positions.length; j += 9) {
        // For each triangle, smooth the vertices towards their centroid
        const centroidX = (positions[j] + positions[j+3] + positions[j+6]) / 3;
        const centroidY = (positions[j+1] + positions[j+4] + positions[j+7]) / 3;
        const centroidZ = (positions[j+2] + positions[j+5] + positions[j+8]) / 3;
        
        // Apply limited smoothing to avoid collapsing the mesh
        const smoothFactor = 0.1;
        for (let k = 0; k < 9; k += 3) {
          tempPositions[j+k] += (centroidX - positions[j+k]) * smoothFactor;
          tempPositions[j+k+1] += (centroidY - positions[j+k+1]) * smoothFactor;
          tempPositions[j+k+2] += (centroidZ - positions[j+k+2]) * smoothFactor;
        }
      }
      
      // Update positions
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(tempPositions, 3));
      
      // Recompute normals
      geometry.computeVertexNormals();
    }
  }
}