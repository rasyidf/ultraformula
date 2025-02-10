
import { BaseFormula } from "@/formulas/BaseFormula";
import { FormulaParser } from "./FormulaParser";
import * as THREE from "three";
import { FormulaMetadata, FormulaParams } from "@/types/Formula";

export class DynamicFormula extends BaseFormula {
  metadata: FormulaMetadata;
  private formulaString: string;

  constructor(
    metadata: FormulaMetadata,
    formulaString: string,
  ) {
    super();
    this.metadata = metadata;
    this.formulaString = formulaString;
  }

  validate(): boolean {
    return FormulaParser.validateFormula(this.formulaString);
  }

  calculate(params: FormulaParams): number {
    return FormulaParser.evaluate(this.formulaString, params);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    // Default geometry implementation
    return new THREE.BufferGeometry();
  }
}