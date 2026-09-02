import { formulaRegistry } from "~/lib/formulas";
import type { NodeCategory, NodeDefinition } from "../types";
import { expressionNode } from "./expression";
import { formulaAsGeneratorNode } from "./generator";
import {
  checkerNode,
  constantNode,
  linearGradientNode,
  radialGradientNode,
} from "./generators";
import { randomNode, seedNode, valueNode } from "./inputs";
import {
  blurNode,
  combineNode,
  domainWarpNode,
  levelsNode,
  terraceNode,
  thresholdNode,
  transformNode,
} from "./modifiers";
import { colorizeNode, outputNode } from "./output";
import { erosionNode, heightmapNode, thermalErosionNode } from "./simulation";
import { tileToFieldNode } from "./tiles";

export const nodeRegistry: Record<string, NodeDefinition> = {};

function register(...defs: NodeDefinition[]) {
  for (const def of defs) nodeRegistry[def.type] = def;
}

/**
 * x/z scalar noise fields: grid-sample them with vertical exaggeration rather
 * than treating them as parametric surfaces.
 */
const TERRAIN_LIKE = new Set(["terrainGen", "cellularNoise"]);

// --- Inputs: number sources that drive parameter sockets --------------------
register(valueNode, seedNode, randomNode);

// --- Generators: fields from nothing ---------------------------------------
register(constantNode, radialGradientNode, linearGradientNode, checkerNode);
register(expressionNode);

// --- Noise / parametric generators wrapped from the Formula registry -------
for (const [key, formula] of Object.entries(formulaRegistry)) {
  register(
    formulaAsGeneratorNode(key, formula, {
      terrainLike: TERRAIN_LIKE.has(key),
    }),
  );
}

// --- Modifiers: reshape one field -----------------------------------------
register(domainWarpNode, transformNode, blurNode); // Distort
register(levelsNode, terraceNode, thresholdNode); // Shape
register(combineNode, tileToFieldNode); // Combine

// --- Simulation: field -> heightmap --------------------------------------
register(heightmapNode); // Bake
register(erosionNode, thermalErosionNode); // Erosion

// --- Output: theme + terminal -------------------------------------------
register(colorizeNode, outputNode);

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeRegistry[type];
}

export const nodeDefinitions = (): NodeDefinition[] => Object.values(nodeRegistry);

/** Display order for the node-library panel. */
export const CATEGORY_ORDER: NodeCategory[] = [
  "Input",
  "Generator",
  "Noise",
  "Modifier",
  "Simulation",
  "Output",
];
