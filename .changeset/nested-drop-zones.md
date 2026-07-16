---
"@snapgridjs/dnd": minor
"@snapgridjs/react": minor
---

Nested non-grid drop zones can now win collision precedence over the grid they sit inside. A plain `useDroppable` placed in a grid tile — a trash slot, an archive panel, a sub-list — opts into snapgrid's depth ranking by passing the new `nestedDropCollisionDetector` and marking its element with `SNAPGRID_DROPPABLE_ATTR` (`data-snapgrid-droppable`). Depth counts every marked boundary, not just grids, so arbitrary nesting resolves innermost-first — a drop zone inside a drop zone outranks its parent, the same rule that ranks an inner grid above its outer one. When the zone wins, the grid backs off (no placeholder, layout untouched — its engine reverts the tile) and you handle the drop on the shared `DragDropProvider`.
