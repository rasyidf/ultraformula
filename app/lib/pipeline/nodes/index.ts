import { formulaRegistry } from "~/lib/formulas";
import type { NodeDefinition } from "../types";
import { erosionNode } from "./erosion";
import { expressionNode } from "./expression";
import { formulaAsGeneratorNode } from "./generator";
import { blendNode, curveNode, domainWarpNode, transformNode } from "./modifiers";
import { outputNode } from "./output";

export const nodeRegistry: Record<string, NodeDefinition> = {};

function register(def: NodeDefinition) {
  nodeRegistry[def.type] = def;
}

// Every registered Formula becomes a generator node.
for (const [key, formula] of Object.entries(formulaRegistry)) {
  register(formulaAsGeneratorNode(key, formula));
}

register(expressionNode);
register(domainWarpNode);
register(blendNode);
register(transformNode);
register(curveNode);
register(erosionNode);
register(outputNode);

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeRegistry[type];
}

export const nodeDefinitions = (): NodeDefinition[] => Object.values(nodeRegistry);
