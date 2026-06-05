# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) from 1.0 onward.

## [0.4.0] - 2026-06-05

Nested grids gain **cross-level dragging**, and all packages now move in lockstep on one version.

### Added

- `@snapgridjs/react`: **nested grids share one provider and support cross-level dragging.** A grid
  inside another tile shares the outer `DragDropProvider`; collision resolves the **innermost** grid
  under the pointer, so a drag stays scoped to the inner grid until you drag a tile out, and tiles
  move between levels. A grid won't accept a source that contains it. Keep a nested grid
  self-contained by giving it its own `DragDropProvider`.

### Fixed

- `@snapgridjs/core`: a tile received from another grid (cross-grid or nested) couldn't land in an
  occupied row — e.g. the target grid's top row. It now displaces the occupant, matching a same-grid drop.

### Changed

- `@snapgridjs/core`, `@snapgridjs/react`, and `@snapgridjs/extras` now share **one version** and are
  released together (lockstep), so a given version number is always a matched set.

## [0.3.0] - 2026-06-04

**Pinned tiles** — a `static` item can opt back into user interaction.

### Added

- `@snapgridjs/react`: a `static` item that also sets `isDraggable: true` stays anchored against
  compaction (others flow around it) yet can still be dragged by the user — a "pinned" tile.
  `isResizable: true` does the same for resizing. A plain `static` item stays fully locked as before.

### Changed

- `@snapgridjs/extras`: the `gravity` / `masonry` / `shelf` packers now honor `static` placement
  (statics are reserved in place and movable items pack around them), matching the built-in
  compactors.

## [0.2.0] - 2026-06-04

The headless layer is rebuilt to be **dnd-kit–native**. A dragged tile now floats itself (dnd-kit's
default feedback) instead of being mirrored by a separate overlay, and a grid composes into a
`DragDropProvider` you supply rather than minting its own. This is a breaking change to the headless
API only — the turnkey `<GridLayout>` / `<SnapGridGroup>` components still supply the provider for you
and are unaffected.

### Changed

- **Breaking** — `@snapgridjs/react`: `SnapGridProvider` is removed. Render inside a dnd-kit
  `DragDropProvider` and host the grid with the new `useGridContainer(options)` hook (returns
  `{ containerProps, group, isDropTarget, controller }`); tiles resolve their grid by `group`.
- `useGridItem(id, group)` is now a real dnd-kit `useSortable`, so tiles interoperate with the dnd-kit
  sortable ecosystem.
- Drop targets resolve through dnd-kit's collision system — one oracle drives both the move preview and
  the drop, making cross-grid and external drops more robust.
- `snapToGrid` is now implemented as a dnd-kit `Modifier` (still toggled via `dragConfig.snapToGrid`).

### Added

- `useGridItem` exposes an optional `handleRef` for wiring a drag handle.
- Live drag state lives in an observable `GridController`, so a drag re-renders only the tiles whose
  cell actually changed.
- dnd-kit's raw `DragOverlay` is re-exported as an escape hatch for a custom floating preview.

### Removed

- **Breaking** — `@snapgridjs/react`: `GridDragOverlay`, `useGridDragOverlay`, and `dragOverlayStyle`.
  A dragged tile floats itself, so there is no overlay to render.

## [0.1.0] - 2026-05-31

Initial public release.

### Added

- `@snapgridjs/react`: controlled `GridLayout`, `ResponsiveGridLayout`, `GridItem`, `GridPlaceholder`,
  `GridDragOverlay`, and the headless `SnapGridProvider` + hooks.
- `SnapGridGroup` for dragging tiles between grids; external-drop support via `dropConfig` / `onDrop`.
- `@snapgridjs/extras`: `masonry`, `gravity`, `shelf` packers (plus `wrap` and fast compactors).
- `useContainerWidth`, `useResponsiveLayout`, and opt-in grid snapping (`dragConfig.snapToGrid`).
- Keyboard dragging: focus a tile, Enter/Space to pick up, arrow keys to move a cell at a time,
  Enter/Space to drop, Escape to cancel.
- Documentation site (`apps/docs`) with guides, API reference, and live examples — including a
  nested-grids guide and a real-world showcase dashboard.

[0.4.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.4.0
[0.3.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.3.0
[0.2.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.2.0
[0.1.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.1.0
