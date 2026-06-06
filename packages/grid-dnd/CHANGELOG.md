# @snapgridjs/dnd

## 0.6.0

### Minor Changes

- bd5aead: dnd-kit ecosystem interop — drag between a grid and a foreign `useSortable` list or board

  A grid now composes with the wider dnd-kit ecosystem, not just other grids. Under one
  `DragDropProvider`, a `useSortable` card can be dragged into a grid (it lands at a real cell, with
  compaction), a tile can be dragged back out, and the list reorders — all in the same drag.

  - **`snapMove(layout, event, ctx)`** (`@snapgridjs/dnd`, re-exported from `@snapgridjs/react`) — the
    reducer that places a dragged item into a grid `Layout` at the pointer cell; call it from your own
    `onDragOver`. Take a tile out with `removeItemWithCompactor`, now re-exported from
    `@snapgridjs/react` alongside `insertItemWithCompactor`, `toPositionParams`, and `defaultGridConfig`.
  - **`accept`** option on `useGridContainer` / `<GridLayout>` — opt a foreign sortable in as a drop
    target (you drive the receive in `onDragOver`).
  - Grid tiles now position with `left`/`top` rather than a `transform`, so dnd-kit's self-float reads
    each tile's true rect across the hand-off; reflow still animates on the compositor (a FLIP). Spread
    the `style` from `useGridItem` as before and don't override the position.
  - Grid collision is now pointer-based: a grid claims a drag while the pointer is inside it, not while
    the dragged tile's rect overlaps it — letting a tile leave a grid for an adjacent sortable, and
    matching the pointer-based receive math.

  See the new [dnd-kit interop guide](https://snapgrid.dev/docs/guides/dnd-kit-interop).

### Patch Changes

- @snapgridjs/core@0.6.0

## 0.5.0

### Minor Changes

- afa1b91: Extract the framework-agnostic dnd-kit engine into a new package, **`@snapgridjs/dnd`**.

  The drag/resize/cross-grid orchestration — previously spread across each grid's
  React controller (one dnd-kit monitor per grid) — is now a single per-manager
  engine with no React dependency, living in `@snapgridjs/dnd` alongside the
  observable `GridController` bridge, the registry, collision detector, snap-to-grid
  modifier, and sensors. `@snapgridjs/react` is now a thin binding over it.

  For React consumers this is a transparent internal change: the `@snapgridjs/react`
  public API is unchanged (the drag/drop config and event types are still exported
  from it, now re-exported from the engine package). The new package exists so
  Vue/Solid/Svelte bindings can share one engine, and exposes a binding-author
  surface (`attachEngine`, `GridController`, `registerController`/`getController`,
  and the dnd-kit interaction helpers).

  Internally, one engine now drives every grid on a manager (instead of N monitors),
  so multi-grid pages process each drag event once rather than per grid.

### Patch Changes

- @snapgridjs/core@0.5.0
