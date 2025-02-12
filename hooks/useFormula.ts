import { useState } from 'react';
import { FormulaParams } from '@/types/Formula';
import { formulaRegistry, getFormula } from '@/formulas';

export interface SuperformulaState {
  formulaType: string;
  params: FormulaParams;
  lockedParams: Set<string>;
  autoRotate: boolean;
  backgroundColor: string;
  meshColor: string;
  scale: number;
  ambientLightIntensity: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  cameraPosition: [number, number, number];
}

function useFormula() {
  const [state, setState] = useState<SuperformulaState>({
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
    autoRotate: false,
    backgroundColor: "#f0f0f0",
    meshColor: "#00ff00",
    scale: 1,
    ambientLightIntensity: 0.5,
    pointLightIntensity: 1,
    pointLightPosition: [10, 10, 10],
    cameraPosition: [5, 5, 5],
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
    randomizeParams();
  };

  const setAutoRotate = (value: boolean) => {
    setState(prev => ({ ...prev, autoRotate: value }));
  };

  const setBackgroundColor = (color: string) => {
    setState(prev => ({ ...prev, backgroundColor: color }));
  };

  const setMeshColor = (color: string) => {
    setState(prev => ({ ...prev, meshColor: color }));
  };

  const setScale = (scale: number) => {
    setState(prev => ({ ...prev, scale }));
  };

  const setAmbientLightIntensity = (intensity: number) => {
    setState(prev => ({ ...prev, ambientLightIntensity: intensity }));
  };

  const setPointLightIntensity = (intensity: number) => {
    setState(prev => ({ ...prev, pointLightIntensity: intensity }));
  };

  const setPointLightPosition = (axis: 'x' | 'y' | 'z', value: number) => {
    setState(prev => ({
      ...prev,
      pointLightPosition: prev.pointLightPosition.map((v, i) =>
        i === (['x', 'y', 'z'].indexOf(axis)) ? value : v
      ) as [number, number, number]
    }));
  };

  const setCameraPosition = (axis: 'x' | 'y' | 'z', value: number) => {
    setState(prev => ({
      ...prev,
      cameraPosition: prev.cameraPosition.map((v, i) =>
        i === (['x', 'y', 'z'].indexOf(axis)) ? value : v
      ) as [number, number, number]
    }));
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
    setAutoRotate,
    setBackgroundColor,
    setMeshColor,
    setScale,
    setAmbientLightIntensity,
    setPointLightIntensity,
    setPointLightPosition,
    setCameraPosition,
  };
}

export { useFormula as useSuperformula };


