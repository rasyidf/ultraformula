import { formulaRegistry } from "~/lib/formulas";
import type { NodeDefinition } from "../types";
import { materializeNode, meshifyNode, thermalErosionNode } from "./bake";
import { erosionNode } from "./erosion";
import { expressionNode } from "./expression";
import { formulaAsGeneratorNode } from "./generator";
import {
  checkerNode,
  constantNode,
  linearGradientNode,
  radialGradientNode,
} from "./generators";
import {
  blendNode,
  blurNode,
  curveNode,
  domainWarpNode,
  maskNode,
  remapNode,
  terraceNode,
  transformNode,
} from "./modifiers";
import { outputNode } from "./output";
import { tileToFieldNode } from "./tiles";

export const nodeRegistry: Record<string, NodeDefinition> = {};

function register(def: NodeDefinition) {
  nodeRegistry[def.type] = def;
}

// x/z scalar fields: grid-sampled with exaggeration rather than their own
// (flat) createGeometry.
const TERRAIN_LIKE = new Set(["terrainGen", "cellularNoise"]);

for (const [key, formula] of Object.entries(formulaRegistry)) {
  register(
    formulaAsGeneratorNode(key, formula, {
      terrainLike: TERRAIN_LIKE.has(key),
    }),
  );
}

// Procedural generators
register(expressionNode);
register(constantNode);
register(radialGradientNode);
register(linearGradientNode);
register(checkerNode);

// Modifiers
register(domainWarpNode);
register(blendNode);
register(maskNode);
register(transformNode);
register(curveNode);
register(remapNode);
register(terraceNode);
register(blurNode);

// Tiles / constraint
register(tileToFieldNode);

// Simulation / bake
register(erosionNode);
register(thermalErosionNode);
register(materializeNode);

// Output
register(meshifyNode);
register(outputNode);

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeRegistry[type];
}

export const nodeDefinitions = (): NodeDefinition[] => Object.values(nodeRegistry);
