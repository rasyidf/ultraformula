import type { ParameterMetadata } from "~/types/Formula";
import type { Field, PortValue } from "../types";

export function num(
  name: string,
  opts: Partial<ParameterMetadata> & { default: number },
): ParameterMetadata {
  return { name, min: 0, max: 1, step: 0.01, ...opts };
}

export function select(
  name: string,
  choices: number[],
  choiceLabels: string[],
  def = 0,
): ParameterMetadata {
  return {
    name,
    controlType: "select",
    choices,
    choiceLabels,
    default: def,
    min: choices[0],
    max: choices[choices.length - 1],
    step: 1,
  };
}

export function toggle(name: string, def = 0): ParameterMetadata {
  return { name, controlType: "toggle", default: def, min: 0, max: 1, step: 1 };
}

export function expectField(v: PortValue | undefined, label: string): Field {
  if (!v) throw new Error(`${label}: missing input`);
  if (v.type !== "field") throw new Error(`${label}: expected a field input`);
  return v.value as Field;
}
