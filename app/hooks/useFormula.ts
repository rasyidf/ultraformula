import { useState } from 'react';
import { formulaRegistry, getFormula } from '~/lib/formulas';
import type { FormulaParams, ParameterMetadata } from '~/types/Formula';

export interface FormulaState {
  formulaType: string;
  params: FormulaParams;
  lockedParams: Set<string>;
  meshColor: string;
  materialType: "standard" | "wireframe" | "wobble" | "transmission" | "reflector";
  wireframe: boolean;
  enableFloat: boolean;
  showOutlines: boolean;
  outlineColor: string;
}

export function useFormula() {
  const [state, setState] = useState<FormulaState>({
    formulaType: "gielis",
    params: {
      phi: 0,
      a: 1,
      b: 1,
      m: 6,
      n1: 1,
      n2: 1,
      n3: 1
    },
    lockedParams: new Set(),
    meshColor: "#00ff00",
    materialType: "standard",
    wireframe: true,
    enableFloat: false,
    showOutlines: false,
    outlineColor: "#ffffff",
  });

  const toggleParamLock = (paramName: string) => {
    setState(prev => {
      const newLocked = new Set(prev.lockedParams);
      if (newLocked.has(paramName)) {
        newLocked.delete(paramName);
      } else {
        newLocked.add(paramName);
      }
      return { ...prev, lockedParams: newLocked };
    });
  };

  const randomValueFor = (metadata: ParameterMetadata): number => {
    if (metadata?.controlType === "select") {
      const choices = metadata.choices ?? [];
      if (choices.length) return choices[Math.floor(Math.random() * choices.length)];
      return metadata.default ?? metadata.min ?? 0;
    }
    if (metadata?.controlType === "toggle") {
      return Math.random() < 0.5 ? 0 : 1;
    }
    const min = metadata?.min ?? 0;
    const max = metadata?.max ?? 100;
    const raw = Math.random() * (max - min) + min;
    return metadata?.step === 1 ? Math.round(raw) : raw;
  };

  /** Full param set for a formula: locked params kept, everything else randomized. */
  const buildParamsForFormula = (type: string, prev: FormulaState): FormulaParams => {
    const formula = getFormula(type);
    const next: FormulaParams = {};
    Object.entries(formula.metadata.parameters).forEach(([key, metadata]) => {
      if (prev.lockedParams.has(key) && prev.params[key] !== undefined) {
        next[key] = prev.params[key];
      } else {
        next[key] = randomValueFor(metadata);
      }
    });
    return next;
  };

  const randomizeParams = () => {
    setState(prev => ({ ...prev, params: buildParamsForFormula(prev.formulaType, prev) }));
  };

  const getFormulaMetadata = () => {
    return getFormula(state.formulaType).metadata;
  };

  const updateParam = (key: keyof FormulaParams, value: number) => {
    setState(prev => ({
      ...prev,
      params: { ...prev.params, [key]: value }
    }));
  };

  const calculateFormula = (params: FormulaParams) => {
    const formula = getFormula(state.formulaType);
    return formula.calculate({ ...state.params, phi: Math.PI / 180, ...params });
  };

  const setFormulaType = (type: string) => {
    setState(prev => {
      if (type === prev.formulaType) return prev;
      // Rebuild params from the new formula's metadata so every declared param
      // has a value (stale params from the previous formula are dropped).
      return { ...prev, formulaType: type, params: buildParamsForFormula(type, prev) };
    });
  };

  const setMeshColor = (color: string) => {
    setState(prev => ({ ...prev, meshColor: color }));
  };

  const setMaterialType = (type: "standard" | "wireframe" | "wobble" | "transmission" | "reflector") => {
    setState(prev => ({ ...prev, materialType: type }));
  };

  const setWireframe = (value: boolean) => {
    setState(prev => ({ ...prev, wireframe: value }));
  };

  const setFloatEffect = (value: boolean) => {
    setState(prev => ({ ...prev, enableFloat: value }));
  };

  const setOutlinesEnabled = (value: boolean) => {
    setState(prev => ({ ...prev, showOutlines: value }));
  };

  const setOutlineColor = (color: string) => {
    setState(prev => ({ ...prev, outlineColor: color }));
  };

  return {
    state,
    formulas: formulaRegistry,
    getFormulaMetadata,
    updateParam,
    toggleParamLock,
    randomizeParams,
    calculateFormula,
    setFormulaType,
    setMeshColor,
    setMaterialType,
    setWireframe,
    setFloatEffect,
    setOutlinesEnabled,
    setOutlineColor,
  };
}


