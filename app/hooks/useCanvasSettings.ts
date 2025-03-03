import { useState } from 'react';

export interface CanvasSettings {
  backgroundColor: string;
  renderMode: '2d' | '3d';
  scale: number;
  autoRotate: boolean;
  showAxes: boolean;
  showGrid: boolean;
  showShadows: boolean;
  showEnvironment: boolean;
  environmentPreset: string;
  showStats: boolean;
}

export function useCanvasSettings() {
  const [settings, setSettings] = useState<CanvasSettings>({
    backgroundColor: "#f0f0f0",
    renderMode: '3d',
    scale: 1,
    autoRotate: false,
    showAxes: false,
    showGrid: true,
    showShadows: true,
    showEnvironment: false,
    environmentPreset: "warehouse",
    showStats: false
  });

  const updateSettings = (updatedSettings: Partial<CanvasSettings>) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
  };

  const setRenderMode = (mode: '2d' | '3d') => {
    setSettings(prev => ({ ...prev, renderMode: mode }));
  };

  const setBackgroundColor = (color: string) => {
    setSettings(prev => ({ ...prev, backgroundColor: color }));
  };

  const setScale = (scale: number) => {
    setSettings(prev => ({ ...prev, scale }));
  };

  const setAutoRotate = (value: boolean) => {
    setSettings(prev => ({ ...prev, autoRotate: value }));
  };

  const setShowAxes = (value: boolean) => {
    setSettings(prev => ({ ...prev, showAxes: value }));
  };

  const setShowGrid = (value: boolean) => {
    setSettings(prev => ({ ...prev, showGrid: value }));
  };

  const setShowShadows = (value: boolean) => {
    setSettings(prev => ({ ...prev, showShadows: value }));
  };

  const setEnvironmentPreset = (preset: string) => {
    setSettings(prev => ({ ...prev, environmentPreset: preset }));
  };

  const setShowEnvironment = (value: boolean) => {
    setSettings(prev => ({ ...prev, showEnvironment: value }));
  };

  const setShowStats = (value: boolean) => {
    setSettings(prev => ({ ...prev, showStats: value }));
  };

  return {
    settings,
    updateSettings,
    setRenderMode,
    setBackgroundColor,
    setScale,
    setAutoRotate,
    setShowAxes,
    setShowGrid,
    setShowShadows,
    setEnvironmentPreset,
    setShowEnvironment,
    setShowStats
  };
}