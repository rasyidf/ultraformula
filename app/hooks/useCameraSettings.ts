import { useState } from 'react';

export interface CameraSettings {
  cameraPosition: [number, number, number];
  ambientLightIntensity: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
}

export function useCameraSettings() {
  const [settings, setSettings] = useState<CameraSettings>({
    cameraPosition: [5, 5, 5],
    ambientLightIntensity: 0.5,
    pointLightIntensity: 1,
    pointLightPosition: [10, 10, 10],
  });

  const updateSettings = (updatedSettings: Partial<CameraSettings>) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
  };

  const setCameraPosition = (axis: 'x' | 'y' | 'z', value: number) => {
    setSettings(prev => ({
      ...prev,
      cameraPosition: prev.cameraPosition.map((v, i) =>
        i === (['x', 'y', 'z'].indexOf(axis)) ? value : v
      ) as [number, number, number]
    }));
  };

  const setAmbientLightIntensity = (intensity: number) => {
    setSettings(prev => ({ ...prev, ambientLightIntensity: intensity }));
  };

  const setPointLightIntensity = (intensity: number) => {
    setSettings(prev => ({ ...prev, pointLightIntensity: intensity }));
  };

  const setPointLightPosition = (axis: 'x' | 'y' | 'z', value: number) => {
    setSettings(prev => ({
      ...prev,
      pointLightPosition: prev.pointLightPosition.map((v, i) =>
        i === (['x', 'y', 'z'].indexOf(axis)) ? value : v
      ) as [number, number, number]
    }));
  };

  return {
    settings,
    updateSettings,
    setCameraPosition,
    setAmbientLightIntensity,
    setPointLightIntensity,
    setPointLightPosition
  };
}