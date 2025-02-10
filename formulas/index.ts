import { GielisFormula } from "./GielisFormula";
import { TerrainFormula } from "./TerrainFormula";
import { Formula } from "../types/Formula";

export const formulaRegistry: Record<string, Formula> = {
  gielis: new GielisFormula(),
  terrainGen: new TerrainFormula(),
};

export const getFormula = (type: string): Formula => {
  const formula = formulaRegistry[type];
  if (!formula) {
    throw new Error(`Formula type '${type}' not found`);
  }
  return formula;
};
