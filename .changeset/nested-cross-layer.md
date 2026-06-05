---
"@snapgridjs/react": minor
---

Nested grids now support **cross-level dragging**. A grid nested inside another tile shares the outer grid's `DragDropProvider` (one dnd-kit manager); collision resolves the **innermost** grid under the pointer, so a drag stays scoped to the inner grid until you drag a tile out, and tiles move freely between levels. A grid won't accept a source that contains it (no dropping a host tile into its own nested grid). To keep a nested grid self-contained, give it its own `DragDropProvider`.
