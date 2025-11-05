## Quick orientation for AI coding agents

This project is a TypeScript React app using React Router's full-stack template (Vite + react-router dev/server). The code lives under `app/` and uses the path alias `~/*` -> `app/*` (see `tsconfig.json`).

Key facts you must know before making edits:

- Run & build
  - `bun dev` — start the local dev server (uses `react-router dev` via Vite).
  - `bun run build` — produce build output (client + server). Build output lives under `build/` and the server entry is `build/server/index.js`.
  - `bun start` — serve the built server bundle.
  - `bun typecheck` — runs `react-router typegen && tsc` (use this to catch type issues).

- Important directories and files
  - `app/` — application source. Major subfolders:
    - `app/components/` — UI and canvas components (e.g. `FormulaCanvas.tsx`, `FormulaCreator.tsx`, `MainPage.tsx`).
    - `app/contexts/FormulaContext.tsx` — single context provider for formula state exposed via `useSuperformulaContext()`; most components read/write state from here.
    - `app/lib/` — core domain logic: `FormulaParser.ts` (parsing/validation/evaluation), `FormulaFactory.ts` (dynamic formulas and geometry), `formulas/` (concrete formula implementations).
    - `app/hooks/` — custom hooks such as `useFormula`, `useCanvasSettings`, `useCameraSettings` used by the context/provider.
  - `vite.config.ts` — includes `@react-router/dev`, Tailwind plugin and `vite-tsconfig-paths`.
  - `tsconfig.json` — strict types, `~` path mapping, and `noEmit: true` (typecheck only).

- Conventions & patterns used in this repo
  - Path alias: imports use `~/...` to reference `app/` (e.g. `import { FormulaParser } from '~/lib/FormulaParser'`).
  - React Router Dev: routing is configured in `app/routes.ts` (routes reference `routes/*.tsx`). Use the `react-router` dev tooling when testing route changes.
  - Client vs server: files using React client features include a top-line `"use client"`. Keep SSR boundaries in mind when touching global objects.
  - UI primitives: `app/components/ui/` contains many Radix + Tailwind-based building blocks. Reuse these rather than duplicating styles.

- Formula domain specifics (very important)
  - Formula strings must start with `=`. See `app/lib/FormulaParser.ts` — `validateFormula()` checks `startsWith('=')`.
  - Parameter detection and evaluation:
    - `FormulaParser.detectParameters(formula)` tokenizes `formula.slice(1)` and returns variable names and default metadata.
    - `FormulaParser.evaluate(formula, variables)` uses a new Function wrapper which binds `globalThis.Math` as `Math`; only allow-listed math functions exist in `ALLOWED_FUNCTIONS` (see `FormulaParser.ts`).
    - When editing parsing/evaluation, update `app/components/FormulaCreator.tsx` which calls `detectParameters()` and the UI that depends on it.
  - Geometry generation: `DynamicFormula.createGeometry()` (in `app/lib/FormulaFactory.ts`) generates three.js BufferGeometry from formula outputs — changes here affect rendering performance and vertex count (segments/rings variables).

- Safety notes for code changes
  - Formula evaluation uses `new Function(...)` — changing the evaluation logic can introduce code injection or runtime errors. Keep validation and the allowed function list in sync.
  - `tsconfig` is strict; run `npm run typecheck` after edits.

- Suggested priorities for an agent making changes
  - If changing formula parsing/evaluation: update `FormulaParser.ts`, then `FormulaCreator.tsx` (UI parameter detection), and add small unit-like checks (or manual run with `npm run dev`) to validate behavior.
  - If changing rendering: review `FormulaFactory.ts`, `FormulaCanvas.tsx`, `CanvasMesh.tsx` and keep polygon counts controllable via parameters.
  - If adding exports or new hooks, follow existing naming (`useXxx`) and expose them via the `FormulaContext` when they represent app-wide state.

- Quick-file examples (copy/paste references)
  - Validate formula: `app/lib/FormulaParser.ts` -> `static validateFormula(formula: string): boolean` (checks `startsWith('=')`, tokenizes and validates parentheses and allowed functions).
  - Detect parameters: `app/components/FormulaCreator.tsx` -> `FormulaParser.detectParameters(formulaString)` used to auto-create parameter controls.
  - Use context: `const { formulaState, calculateFormula } = useSuperformulaContext();` — `useSuperformulaContext()` is defined in `app/contexts/FormulaContext.tsx`.

## Development Checklist

### 🚀 Features to Add
- [ ] **Formula Library Expansion**
  - Add more built-in formulas to `app/lib/formulas/` (Klein bottle, Torus, Rose curves, Lissajous curves)
  - Implement formula categories/tags in `FormulaMetadata` for better organization
  - Add formula search/filter functionality in UI
  - Support formula templates/presets for common patterns

- [ ] **Enhanced UI/UX**
  - Add undo/redo functionality for parameter changes
  - Implement formula sharing via URL parameters or export/import
  - Add real-time formula preview while typing in `FormulaCreator`
  - Create formula gallery with thumbnails and descriptions
  - Add dark/light theme toggle (next-themes is already installed)

- [ ] **Advanced Rendering**
  - Add more material types (holographic, crystal, metal variations)
  - Implement adaptive geometry detail based on viewport size/performance
  - Add animation/morphing between formulas over time
  - Support point cloud rendering mode for complex geometries
  - Add screenshot/export functionality for generated models

- [ ] **Performance & Optimization**
  - Implement Web Workers for heavy geometry calculations (`DynamicFormula.createGeometry`)
  - Add geometry caching to avoid recalculation on parameter lock/unlock
  - Optimize `MarchingCubes` algorithm with spatial indexing
  - Add progressive loading for complex formulas with high vertex counts

### 🔧 Improvements & Refactoring
- [ ] **Code Quality**
  - Add comprehensive unit tests for `FormulaParser` validation and evaluation
  - Add integration tests for formula rendering pipeline
  - Implement proper error boundaries around `Canvas` components
  - Add JSDoc comments to core classes (`FormulaParser`, `DynamicFormula`, noise classes)

- [ ] **Formula System Enhancement**
  - Extend `FormulaParser.ALLOWED_FUNCTIONS` with more math functions (atan2, sinh, cosh, etc.)
  - Add support for constants (PI, E) in formula parsing
  - Implement parameter constraints/validation (min/max enforcement in UI)
  - Add parameter linking (e.g., aspect ratio constraints)

- [ ] **Developer Experience**
  - Add formula validation with better error messages showing line/column numbers
  - Create formula debugging tools (step-through parameter evaluation)
  - Add hot-reload for formula changes during development
  - Implement formula performance profiling and optimization suggestions

- [ ] **UI Component Polish**
  - Standardize parameter control types (`ParameterMetadata.controlType` is defined but not fully used)
  - Add keyboard shortcuts for common actions (randomize params, reset view, etc.)
  - Improve responsive design for mobile/tablet usage
  - Add accessibility improvements (ARIA labels, keyboard navigation)

### 🐛 Bug Fixes & Edge Cases
- [ ] **Formula Parsing Issues**
  - Handle division by zero in `FormulaParser.evaluate()` gracefully
  - Fix parameter detection for nested function calls and complex expressions
  - Validate formula syntax more thoroughly (unmatched parentheses, invalid operators)
  - Handle edge cases in tokenization (scientific notation, negative numbers)

- [ ] **Geometry Generation**
  - Fix normal calculation issues in `DynamicFormula.createGeometry()` for non-spherical shapes
  - Address vertex duplication in complex geometries (see `MarchingCubes.unifyVertices`)
  - Handle degenerate triangles and self-intersecting geometry
  - Fix UV mapping for procedural textures

- [ ] **State Management**
  - Fix parameter synchronization issues between `FormulaContext` and UI components
  - Handle race conditions in `useFormula` hook during rapid parameter changes
  - Address memory leaks in Three.js geometry disposal
  - Fix canvas resize handling and aspect ratio preservation

- [ ] **Error Handling**
  - Add proper error recovery for failed formula compilation
  - Handle WebGL context loss gracefully
  - Add fallback rendering for unsupported browser features
  - Improve error messages for invalid parameter ranges

### 📋 TODO Items
- [ ] **Documentation**
  - Create formula authoring guide with examples and best practices
  - Document performance considerations for different formula types
  - Add API documentation for extending the formula system
  - Create troubleshooting guide for common issues

- [ ] **Infrastructure**
  - Set up automated testing pipeline (`npm run test` doesn't exist yet)
  - Add code coverage reporting
  - Implement semantic versioning for formula compatibility
  - Add performance benchmarking for formula evaluation

- [ ] **Integration & Deployment**
  - Add proper environment variable handling for production builds
  - Implement formula validation in CI/CD pipeline
  - Add monitoring for client-side errors and performance metrics
  - Set up automated dependency updates with compatibility testing

If any part of this file is unclear or you want me to expand a specific section (for example, add concrete examples of tokenization edge-cases or a short test harness), tell me which area to expand and I'll iterate. 
