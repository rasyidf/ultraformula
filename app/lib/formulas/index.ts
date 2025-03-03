import type { Formula } from "~/types/Formula";
import { CellularNoiseFormula } from "./CellularNoiseFormula";
import { GielisFormula } from "./GielisFormula";
import { GyroidFormula } from "./GyroidFormula";
import { MobiusFormula } from "./MobiusFormula";
import { SineInterferenceFormula } from "./SineInterferenceFormula";
import { TerrainFormula } from "./TerrainFormula";
import { CartesianSineFormula } from "./CartesianSineFormula";

export const formulaRegistry: Record<string, Formula> = {
  gielis: new GielisFormula(),
  terrainGen: new TerrainFormula(),
  sineInterference: new SineInterferenceFormula(),
  gyroid: new GyroidFormula(),
  cellularNoise: new CellularNoiseFormula(),
  mobius: new MobiusFormula(),
  cartesianSine: new CartesianSineFormula(),
};

export const getFormula = (type: string): Formula => {
  const formula = formulaRegistry[type];
  if (!formula) {
    throw new Error(`Formula type '${type}' not found`);
  }
  return formula;
};