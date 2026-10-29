---
"@snapgridjs/solid": minor
---

Add `@snapgridjs/solid` — the SolidJS binding, built on `@dnd-kit/solid`.

Hooks (`useGridContainer`, `useGridItem`, `useGridPlaceholder`, `useGridResizeHandle`,
`useResponsiveLayout`, `useContainerWidth`) plus the turnkey `GridLayout`,
`ResponsiveGridLayout`, `GridItem`, `GridPlaceholder` and `SnapGridGroup` components.
Same framework-free `@snapgridjs/core` + `@snapgridjs/dnd` engine as the React, Svelte and Vue
bindings, so a grid behaves identically whichever framework renders it: cross-grid and
nested dragging, keyboard a11y, resize handles, external drop, pluggable packing.

Requires `solid-js@^1.8`. Components ship as plain `createComponent` calls (no JSX), so one
build serves both the DOM and SSR, with no Solid compiler needed to consume it.
