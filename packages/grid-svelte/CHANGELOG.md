# @snapgridjs/svelte

## 0.9.1

### Patch Changes

- Updated dependencies [6a48e22]
  - @snapgridjs/dnd@0.9.1
  - @snapgridjs/core@0.9.1

## 0.9.0

### Minor Changes

- 341d0d5: Add `@snapgridjs/svelte`, a Svelte 5 binding for snapgrid that mirrors `@snapgridjs/react` on the shared, framework-free engine (`@snapgridjs/core` + `@snapgridjs/dnd`).

  It ships headless factories (`createGridContainer`, `createGridItem`, `createGridPlaceholder`, `createGridResizeHandle`, `createContainerWidth`, `createResponsiveLayout`, `resolveController`) and drop-in components (`GridLayout`, `GridItem`, `GridPlaceholder`, `ResponsiveGridLayout`, `SnapGridGroup`), delivering the same controlled drag, resize, compaction, cross-grid, and nesting behaviour as the React binding — built on `@dnd-kit/svelte`. Requires Svelte 5 (runes).

### Patch Changes

- 65bebeb: Refresh package READMEs for the Svelte release. `@snapgridjs/svelte` now ships a README (install, headless quick start, and the turnkey `<GridLayout>`); the React, core, dnd, and extras READMEs document the Svelte binding alongside React; and documentation links that moved under `/react` and `/svelte` are corrected.
- Updated dependencies [65bebeb]
  - @snapgridjs/core@0.9.0
  - @snapgridjs/dnd@0.9.0
