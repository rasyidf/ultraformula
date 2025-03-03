import { useState } from 'react';
import { formulaRegistry, getFormula } from '~/lib/formulas';
import type { FormulaParams } from '~/types/Formula';

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

  const randomizeParams = () => {
    const formula = getFormula(state.formulaType);
    setState(prev => {
      const newParams = { ...prev.params };
      Object.entries(formula.metadata.parameters).forEach(([key, metadata]) => {
        if (!prev.lockedParams.has(key)) {
          newParams[key] = Math.random() * ((metadata?.max ?? 100) - (metadata?.min ?? 0)) + (metadata?.min ?? 0);
        }
      });
      return { ...prev, params: newParams };
    });
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
    setState(prev => ({ ...prev, formulaType: type }));
    // Only randomize params if the formula type actually changed
    if (type !== state.formulaType) {
      randomizeParams();
    }
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


