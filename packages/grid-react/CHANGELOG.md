# @snapgridjs/react

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
