# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) from 1.0 onward.

## [0.9.0] - 2026-07-20

Svelte support. `@snapgridjs/svelte` brings the same headless-first, dnd-kit-native grid to Svelte 5,
on the shared framework-free core — a grid behaves identically whichever framework renders it.

### Added

- **`@snapgridjs/svelte`** — a Svelte 5 binding for snapgrid, mirroring `@snapgridjs/react` on the
  shared `@snapgridjs/core` + `@snapgridjs/dnd` engine. Headless factories (`createGridContainer`,
  `createGridItem`, `createGridPlaceholder`, `createGridResizeHandle`, `createContainerWidth`,
  `createResponsiveLayout`, `resolveController`) and drop-in components (`GridLayout`, `GridItem`,
  `GridPlaceholder`, `ResponsiveGridLayout`, `SnapGridGroup`) deliver the same controlled drag,
  resize, compaction, cross-grid, nesting, and dnd-kit interop as React — built on `@dnd-kit/svelte`
  with runes + attachments (`{@attach}`). Requires Svelte 5. See the
  [Svelte docs](https://snapgrid.dev/svelte/docs/getting-started).

### Changed

- Documentation is now split per framework — guides and examples live under `/react/…` and
  `/svelte/…`, selectable from the framework switcher — and the package READMEs document the Svelte
  binding alongside React.

## [0.8.0] - 2026-07-16

A consumer's own drop target — a trash slot, an archive panel, a sub-list — can now live inside a
grid tile and win the drop, extending the **innermost-wins** rule beyond nested grids.

### Added

- **Nested non-grid drop zones.** `nestedDropCollisionDetector` + `SNAPGRID_DROPPABLE_ATTR`
  (`@snapgridjs/dnd`, re-exported from `@snapgridjs/react`). Pass the detector to a plain dnd-kit
  `useDroppable` nested in a grid tile and the zone outranks the grid it sits in, so the drop resolves
  to your zone instead of the grid — the grid backs off (it reverts the tile) and you handle the drop
  on the shared `DragDropProvider`. Depth counts every marked boundary, not just grids, so a zone
  inside a zone resolves innermost-first; mark the element with `data-snapgrid-droppable` to rank
  droppables nested inside it. See the
  [nested drop zones](https://snapgrid.dev/docs/guides/nesting) guide.

## [0.7.0] - 2026-06-10

The tile hooks now speak the dnd-kit options-object idiom, and `snapMove` reads the destination
grid's geometry for you — interop `onDragOver` handlers get noticeably smaller.

### Changed

- **`useGridItem` / `useGridResizeHandle` take an options object** (`@snapgridjs/react`, BREAKING) —
  `useGridItem({ id, group })`, `useGridResizeHandle({ id, handle, group })` — mirroring dnd-kit's
  `useSortable`. Move positional call sites to objects.
- **`snapMove` resolves the destination grid** (`@snapgridjs/dnd`, re-exported from
  `@snapgridjs/react`). It reads `positionParams`, the compactor, and the default item size from the
  grid under the pointer (`event.operation.target`), so an interop `onDragOver` no longer rebuilds
  `PositionParams` by hand — every `SnapMoveContext` field is now an optional override. A foreign
  source's `snapGridDrop` spec (size + id) is honored, matching the external-drop path.

### Added

- **Customizable `type`** on `useGridItem` (the tile's sortable `type`) and `useGridContainer` (the
  surface's droppable `type`) — default `"grid-item"` / `"grid"` — to namespace tiles and grids for
  ecosystem interop. The grid identifies its own tiles by their payload, not the type string, so a
  custom type still drags and crosses grids.

## [0.6.1] - 2026-06-07

### Fixed

- `@snapgridjs/dnd`: a grid's landing placeholder could linger over the sortable when a tile was
  dragged out to a foreign dnd-kit `useSortable` list. Once the dragged element is swapped for the
  foreign card mid-drag, the engine's external-source path now clears the source grid's placeholder
  too (it previously only cleared on the in-grid move path, so it surfaced intermittently).

## [0.6.0] - 2026-06-07

A grid now interoperates with the wider **dnd-kit ecosystem**, not just other grids: drag a
`useSortable` card into a grid, a tile back out, or reorder the list — all in one drag, under one
provider.

### Added

- **dnd-kit sortable interop.** `snapMove(layout, event, ctx)` (`@snapgridjs/dnd`, re-exported from
  `@snapgridjs/react`) places a dragged item into a grid `Layout` at the pointer cell, with
  compaction — call it from your own `onDragOver`. `removeItemWithCompactor` is the drag-out
  counterpart, now re-exported from `@snapgridjs/react` alongside `insertItemWithCompactor`,
  `toPositionParams`, and `defaultGridConfig`. See the new
  [dnd-kit interop](https://snapgrid.dev/docs/guides/dnd-kit-interop) guide.
- **`accept` option** on `useGridContainer` / `<GridLayout>` — opt a foreign dnd-kit sortable in as a
  drop target (you drive the receive in `onDragOver`).

### Changed

- Grid tiles now position with `left`/`top` instead of a `transform`, so dnd-kit's self-float reads
  each tile's true rect when it's handed off to a sortable list. Reflow still animates on the
  compositor (a transform FLIP). Spread the `style` from `useGridItem` as before and don't override
  the position.
- Grid collision is now pointer-based: a grid claims a drag while the pointer is inside it, rather
  than while the dragged tile's rectangle overlaps it — letting a tile leave a grid for an adjacent
  sortable, and matching the pointer-based receive math.

## [0.5.0] - 2026-06-06

The dnd-kit engine is extracted into a new package, **`@snapgridjs/dnd`** — the drag/resize/cross-grid
brain is now framework-agnostic and reusable. For React users the upgrade is transparent.

### Added

- **`@snapgridjs/dnd`** — the framework-agnostic dnd-kit engine `@snapgridjs/react` is built on: one
  per-manager drag/resize/cross-grid engine, the observable `GridController` render bridge, the
  collision detector, sensors, and the snap-to-grid modifier. It exists so future Vue/Solid/Svelte
  bindings can share one engine. See the new
  [Architecture & dnd-kit](https://snapgrid.dev/docs/guides/architecture) guide.

### Changed

- `@snapgridjs/react` is now a thin binding over `@snapgridjs/dnd`. **For React consumers this is
  transparent** — the public API is unchanged (drag/drop config and event types are still exported
  from `@snapgridjs/react`, re-exported from the engine package).
- One engine per dnd-kit manager now drives every grid (previously one monitor per grid), so a
  multi-grid page processes each drag event once.
- All four packages — `@snapgridjs/core`, `@snapgridjs/dnd`, `@snapgridjs/react`, `@snapgridjs/extras`
  — now release together in lockstep.

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

[0.9.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.9.0
[0.8.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.8.0
[0.7.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.7.0
[0.6.1]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.6.1
[0.6.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.6.0
[0.5.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.5.0
[0.4.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.4.0
[0.3.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.3.0
[0.2.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.2.0
[0.1.0]: https://github.com/eleung/snapgrid/releases/tag/%40snapgridjs/react%400.1.0
