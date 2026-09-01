import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UiState {
  libraryPanelSize: number;
  inspectorPanelSize: number;
  graphDockSize: number;
  graphCollapsed: boolean;
  projectName: string;

  set: (patch: Partial<UiState>) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      libraryPanelSize: 18,
      inspectorPanelSize: 24,
      graphDockSize: 42,
      graphCollapsed: false,
      projectName: "Untitled pipeline",
      set: (patch) => set(patch),
    }),
    { name: "ultraformula.ui.v2" },
  ),
);
