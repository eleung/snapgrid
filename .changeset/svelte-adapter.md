---
"@snapgridjs/svelte": minor
---

Add `@snapgridjs/svelte`, a Svelte 5 binding for snapgrid that mirrors `@snapgridjs/react` on the shared, framework-free engine (`@snapgridjs/core` + `@snapgridjs/dnd`).

It ships headless factories (`createGridContainer`, `createGridItem`, `createGridPlaceholder`, `createGridResizeHandle`, `createContainerWidth`, `createResponsiveLayout`, `resolveController`) and drop-in components (`GridLayout`, `GridItem`, `GridPlaceholder`, `ResponsiveGridLayout`, `SnapGridGroup`), delivering the same controlled drag, resize, compaction, cross-grid, and nesting behaviour as the React binding — built on `@dnd-kit/svelte`. Requires Svelte 5 (runes).
