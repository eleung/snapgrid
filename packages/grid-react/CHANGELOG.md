# @snapgridjs/react

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

- Updated dependencies [bd5aead]
  - @snapgridjs/dnd@0.6.0
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

- Updated dependencies [afa1b91]
  - @snapgridjs/dnd@0.5.0
  - @snapgridjs/core@0.5.0

## 0.4.0

### Minor Changes

- 927c9fe: Nested grids now support **cross-level dragging**. A grid nested inside another tile shares the outer grid's `DragDropProvider` (one dnd-kit manager); collision resolves the **innermost** grid under the pointer, so a drag stays scoped to the inner grid until you drag a tile out, and tiles move freely between levels. A grid won't accept a source that contains it (no dropping a host tile into its own nested grid). To keep a nested grid self-contained, give it its own `DragDropProvider`.

### Patch Changes

- Updated dependencies [927c9fe]
  - @snapgridjs/core@0.4.0

## 0.3.0

### Minor Changes

- fa6c4ed: Support **pinned** tiles. A `static` item that also sets `isDraggable: true` is now immovable by compaction — other tiles flow around it — yet can still be picked up and dragged by the user (previously any `static` item was fully locked). The `@snapgridjs/extras` packers (`gravity`/`masonry`/`shelf`) now honor `static` placement too, matching the built-in compactors.

## 0.2.0

### Minor Changes

- eccc270: Rebuild the headless layer to be dnd-kit–native: grid tiles are now real dnd-kit sortables, and a dragged tile **floats itself** (dnd-kit's default feedback) rather than being mirrored by a separate overlay. The grid composes into a `DragDropProvider` you supply, instead of minting its own at the headless layer.

  Breaking changes (headless API):

  - `SnapGridProvider` is removed. Render inside a dnd-kit `DragDropProvider` and use the new `useGridContainer(options)` host (returns `{ containerProps, group, isDropTarget, controller }`); tiles resolve their grid by `group`, the way a `useSortable` item declares its list. The turnkey `<GridLayout>` / `<SnapGridGroup>` still supply the provider for you.
  - `GridDragOverlay`, `useGridDragOverlay`, and `dragOverlayStyle` are removed — a dragged tile floats itself, so there's no overlay to render. dnd-kit's raw `DragOverlay` is re-exported as an escape hatch for a separate or custom floating preview.

  New and improved:

  - `useGridItem(id, group)` is now a real `useSortable` (it interoperates with the dnd-kit sortable ecosystem) and exposes an optional `handleRef` for drag handles.
  - Drop targets resolve through dnd-kit's collision system — one oracle for both the move preview and the drop — making cross-grid and external drops more robust.
  - Snap-to-grid is now a dnd-kit `Modifier`, toggled via `dragConfig.snapToGrid`.
  - Live drag state lives in an observable `GridController`, so a drag re-renders only the tiles whose cell actually changed.
