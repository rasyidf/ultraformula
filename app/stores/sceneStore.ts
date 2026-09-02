import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MaterialType =
  | "standard"
  | "wireframe"
  | "wobble"
  | "transmission"
  | "reflector";

export interface SceneState {
  // viewport
  backgroundColor: string;
  activeViewId: string;
  scale: number;
  autoRotate: boolean;
  showAxes: boolean;
  showGrid: boolean;
  showShadows: boolean;
  showEnvironment: boolean;
  environmentPreset: string;
  showStats: boolean;
  // camera & lighting
  cameraPosition: [number, number, number];
  ambientLightIntensity: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  // colour scheme
  /** background / mesh / outline follow the light|dark theme when true */
  syncColorsWithTheme: boolean;
  // material / appearance
  meshColor: string;
  materialType: MaterialType;
  wireframe: boolean;
  enableFloat: boolean;
  showOutlines: boolean;
  outlineColor: string;
  enableVertexColors: boolean;
  // performance
  adaptiveDpr: boolean;
  simResolutionCap: number;

  set: (patch: Partial<SceneState>) => void;
  setCameraAxis: (axis: 0 | 1 | 2, value: number) => void;
  setPointLightAxis: (axis: 0 | 1 | 2, value: number) => void;
  reset: () => void;
}

const defaults = {
  backgroundColor: "#0b0f1a",
  activeViewId: "mesh3d",
  scale: 1,
  autoRotate: false,
  showAxes: false,
  showGrid: true,
  showShadows: true,
  showEnvironment: false,
  environmentPreset: "warehouse",
  showStats: false,
  cameraPosition: [18, 16, 18] as [number, number, number],
  ambientLightIntensity: 0.6,
  pointLightIntensity: 1,
  pointLightPosition: [10, 20, 10] as [number, number, number],
  syncColorsWithTheme: true,
  meshColor: "#e5e7eb",
  materialType: "standard" as MaterialType,
  wireframe: false,
  enableFloat: false,
  showOutlines: false,
  outlineColor: "#ffffff",
  enableVertexColors: true,
  adaptiveDpr: true,
  simResolutionCap: 200,
};

export const useSceneStore = create<SceneState>()(
  persist(
    (set, get) => ({
      ...defaults,
      set: (patch) => set(patch),
      setCameraAxis: (axis, value) => {
        const next = [...get().cameraPosition] as [number, number, number];
        next[axis] = value;
        set({ cameraPosition: next });
      },
      setPointLightAxis: (axis, value) => {
        const next = [...get().pointLightPosition] as [number, number, number];
        next[axis] = value;
        set({ pointLightPosition: next });
      },
      reset: () => set({ ...defaults }),
    }),
    { name: "ultraformula.scene.v2" },
  ),
);
