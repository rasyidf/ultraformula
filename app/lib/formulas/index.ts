import type { Formula } from "~/types/Formula";
import { CellularNoiseFormula } from "./CellularNoiseFormula";
import { DomainWarpFormula } from "./DomainWarpFormula";
import { HydraulicErosionFormula } from "./HydraulicErosionFormula";
import { GielisFormula } from "./GielisFormula";
import { GyroidFormula } from "./GyroidFormula";
import { MobiusFormula } from "./MobiusFormula";
import { SineInterferenceFormula } from "./SineInterferenceFormula";
import { TerrainFormula } from "./TerrainFormula";
import { CartesianSineFormula } from "./CartesianSineFormula";
import { TorusFormula } from "./TorusFormula";
import { KleinBottleFormula } from "./KleinBottleFormula";
import { RoseCurveFormula } from "./RoseCurveFormula";
import { LissajousFormula } from "./LissajousFormula";

export const formulaRegistry: Record<string, Formula> = {
  gielis: new GielisFormula(),
  terrainGen: new TerrainFormula(),
  domainWarp: new DomainWarpFormula(),
  hydraulicErosion: new HydraulicErosionFormula(),
  sineInterference: new SineInterferenceFormula(),
  gyroid: new GyroidFormula(),
  cellularNoise: new CellularNoiseFormula(),
  mobius: new MobiusFormula(),
  cartesianSine: new CartesianSineFormula(),
  torus: new TorusFormula(),
  kleinBottle: new KleinBottleFormula(),
  roseCurve: new RoseCurveFormula(),
  lissajous: new LissajousFormula(),
};

export const getFormula = (type: string): Formula => {
  const formula = formulaRegistry[type];
  if (!formula) {
    throw new Error(`Formula type '${type}' not found`);
  }
  return formula;
};