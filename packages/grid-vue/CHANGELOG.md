# @snapgridjs/vue

## 0.10.0

### Minor Changes

- 0455f15: Add `@snapgridjs/vue` — the Vue 3 binding, built on `@dnd-kit/vue`.

  Composables (`useGridContainer`, `useGridItem`, `useGridPlaceholder`, `useGridResizeHandle`,
  `useResponsiveLayout`, `useContainerWidth`) plus the turnkey `GridLayout`,
  `ResponsiveGridLayout`, `GridItem`, `GridPlaceholder` and `SnapGridGroup` components.
  Same framework-free `@snapgridjs/core` + `@snapgridjs/dnd` engine as the React and Svelte
  bindings, so a grid behaves identically whichever framework renders it: cross-grid and
  nested dragging, keyboard a11y, resize handles, external drop, pluggable packing.

  Requires `vue@^3.5`. Components ship as render functions (no SFC toolchain needed to
  consume or build the package).

### Patch Changes

- @snapgridjs/core@0.10.0
- @snapgridjs/dnd@0.10.0
