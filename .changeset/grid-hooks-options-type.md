---
"@snapgridjs/react": minor
---

**Breaking:** `useGridItem` and `useGridResizeHandle` take an options object instead of positional arguments — `useGridItem({ id, group })` and `useGridResizeHandle({ id, handle, group })` — matching `useSortable`. `useGridItem` and `useGridContainer` gain an optional `type` (default `"grid-item"` / `"grid"`) to namespace tiles and grids for ecosystem interop; the grid identifies its tiles by payload, so a custom type still drags and crosses grids.
