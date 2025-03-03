"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useCameraSettings, type CameraSettings } from '~/hooks/useCameraSettings';
import { useCanvasSettings, type CanvasSettings } from '~/hooks/useCanvasSettings';
import { useFormula, type FormulaState } from '~/hooks/useFormula';
import type { Formula, FormulaParams, ParameterMetadata } from '~/types/Formula';

interface FormulaContextType {
  // Formula state and methods
  formulaState: FormulaState;
  formulas: Record<string, Formula>;
  getFormulaMetadata: () => { name: string; description: string; parameters: Record<string, ParameterMetadata>; supportedDimensions: ('2d' | '3d')[] };
  updateParam: (key: keyof FormulaParams, value: number) => void;
  toggleParamLock: (paramName: string) => void;
  randomizeParams: () => void;
  calculateFormula: (params: FormulaParams) => number;
  setFormulaType: (type: string) => void;
  setMeshColor: (color: string) => void;
  setMaterialType: (type: "standard" | "wireframe" | "wobble" | "transmission" | "reflector") => void;
  setWireframe: (value: boolean) => void;
  setFloatEffect: (value: boolean) => void;
  setOutlinesEnabled: (value: boolean) => void;
  setOutlineColor: (color: string) => void;
  
  // Canvas settings
  canvasSettings: CanvasSettings;
  setRenderMode: (mode: '2d' | '3d') => void;
  setBackgroundColor: (color: string) => void;
  setScale: (scale: number) => void;
  setAutoRotate: (value: boolean) => void;
  setShowAxes: (value: boolean) => void;
  setShowGrid: (value: boolean) => void;
  setShowShadows: (value: boolean) => void;
  setEnvironmentPreset: (preset: string) => void;
  setShowEnvironment: (value: boolean) => void;
  setShowStats: (value: boolean) => void;
  
  // Camera settings
  cameraSettings: CameraSettings;
  setCameraPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  setAmbientLightIntensity: (intensity: number) => void;
  setPointLightIntensity: (intensity: number) => void;
  setPointLightPosition: (axis: 'x' | 'y' | 'z', value: number) => void;
  
  // Formula management
  addFormula: (formula: string) => void;
  removeFormula: (index: number) => void;
}

const FormulaContext = createContext<FormulaContextType | null>(null);

export function FormulaProvider({ children }: { children: ReactNode; }) {
  const formula = useFormula();
  const canvasSettings = useCanvasSettings();
  const camera = useCameraSettings();
  
  const [formulas, setFormulas] = useState<string[]>([]);

  const addFormula = (formula: string) => {
    setFormulas([...formulas, formula]);
  };

  const removeFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index));
  };

  return (
    <FormulaContext.Provider value={{
      // Formula state and methods
      formulaState: formula.state,
      formulas: formula.formulas,
      getFormulaMetadata: formula.getFormulaMetadata,
      updateParam: formula.updateParam,
      toggleParamLock: formula.toggleParamLock,
      randomizeParams: formula.randomizeParams,
      calculateFormula: formula.calculateFormula,
      setFormulaType: formula.setFormulaType,
      setMeshColor: formula.setMeshColor,
      setMaterialType: formula.setMaterialType,
      setWireframe: formula.setWireframe,
      setFloatEffect: formula.setFloatEffect,
      setOutlinesEnabled: formula.setOutlinesEnabled,
      setOutlineColor: formula.setOutlineColor,
      
      // Canvas settings
      canvasSettings: canvasSettings.settings,
      setRenderMode: canvasSettings.setRenderMode,
      setBackgroundColor: canvasSettings.setBackgroundColor,
      setScale: canvasSettings.setScale,
      setAutoRotate: canvasSettings.setAutoRotate,
      setShowAxes: canvasSettings.setShowAxes,
      setShowGrid: canvasSettings.setShowGrid,
      setShowShadows: canvasSettings.setShowShadows,
      setEnvironmentPreset: canvasSettings.setEnvironmentPreset,
      setShowEnvironment: canvasSettings.setShowEnvironment,
      setShowStats: canvasSettings.setShowStats,
      
      // Camera settings
      cameraSettings: camera.settings,
      setCameraPosition: camera.setCameraPosition,
      setAmbientLightIntensity: camera.setAmbientLightIntensity,
      setPointLightIntensity: camera.setPointLightIntensity,
      setPointLightPosition: camera.setPointLightPosition,
      
      // Formula management
      addFormula,
      removeFormula,
    }}>
      {children}
    </FormulaContext.Provider>
  );
}

export function useSuperformulaContext() {
  const context = useContext(FormulaContext);
  if (!context) {
    throw new Error('useSuperformulaContext must be used within a FormulaProvider');
  }
  return context;
}
