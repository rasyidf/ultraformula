import * as THREE from "three";
import type { Formula, FormulaMetadata, FormulaParams } from "~/types/Formula";

export abstract class BaseFormula implements Formula {
  abstract metadata: FormulaMetadata;
  abstract calculate(params: FormulaParams): number;
  abstract createGeometry(params: FormulaParams): THREE.BufferGeometry;
}
