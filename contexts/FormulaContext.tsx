"use client";

import { Formula, FormulaParams, ParameterMetadata } from '@/types/Formula';
import { createContext, ReactNode, useContext, useState } from 'react';
import { SuperformulaState, useSuperformula, } from '../hooks/useFormula';

interface SuperformulaContextType {
  state: SuperformulaState;
  formulas: Record<string, Formula>;
  getFormulaMetadata: () => { name: string; description: string; parameters: Record<string, ParameterMetadata>; };
  updateParam: (key: keyof FormulaParams, value: number) => void;
  toggleParamLock: (paramName: string) => void;
  randomizeParams: () => void;
  calculateFormula: (params: FormulaParams) => number;
  setFormulaType: (type: string) => void;
  setAutoRotate: (value: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setMeshColor: (color: string) => void;
  setScale: (scale: number) => void;
  setAmbientLightIntensity: (intensity: number) => void;
  setPointLightIntensity: (intensity: number) => void;
  setPointLightPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  setCameraPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  addFormula: (formula: string) => void;
  removeFormula: (index: number) => void;
}

const SuperformulaContext = createContext<SuperformulaContextType | null>(null);

export function FormulaProvider({ children }: { children: ReactNode; }) {
  const superformula = useSuperformula();
  const [formulas, setFormulas] = useState<string[]>([]);

  const addFormula = (formula: string) => {
    setFormulas([...formulas, formula]);
  };

  const removeFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index));
  };

  return (
    <SuperformulaContext.Provider value={{ ...superformula, addFormula, removeFormula }}>
      {children}
    </SuperformulaContext.Provider>
  );
}

export function useSuperformulaContext() {
  const context = useContext(SuperformulaContext);
  if (!context) {
    throw new Error('useSuperformulaContext must be used within a SuperformulaProvider');
  }
  return context;
}
