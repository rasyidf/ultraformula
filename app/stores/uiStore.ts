import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UiState {
  libraryPanelSize: number;
  inspectorPanelSize: number;
  graphDockSize: number;
  projectName: string;

  // panel visibility
  showLibrary: boolean;
  showGraph: boolean;
  showInspector: boolean;

  // viewport
  showViewThumbnails: boolean;

  // evaluation
  evalDebounceMs: number;
  evalPaused: boolean;

  // settings dialog (transient-ish, persisted is harmless)
  settingsOpen: boolean;
  settingsTab: string;

  set: (patch: Partial<UiState>) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      libraryPanelSize: 18,
      inspectorPanelSize: 24,
      graphDockSize: 42,
      projectName: "Untitled pipeline",

      showLibrary: true,
      showGraph: true,
      showInspector: true,

      showViewThumbnails: true,

      evalDebounceMs: 120,
      evalPaused: false,

      settingsOpen: false,
      settingsTab: "appearance",

      set: (patch) => set(patch),
    }),
    {
      name: "ultraformula.ui.v2",
      partialize: (s) => ({
        libraryPanelSize: s.libraryPanelSize,
        inspectorPanelSize: s.inspectorPanelSize,
        graphDockSize: s.graphDockSize,
        projectName: s.projectName,
        showLibrary: s.showLibrary,
        showGraph: s.showGraph,
        showInspector: s.showInspector,
        showViewThumbnails: s.showViewThumbnails,
        evalDebounceMs: s.evalDebounceMs,
      }),
    },
  ),
);
