# @snapgridjs/svelte

## 0.13.0

### Patch Changes

- @snapgridjs/core@0.13.0
- @snapgridjs/dnd@0.13.0

## 0.12.0

### Minor Changes

- 7a885a4: Requires dnd-kit 0.5. The `@dnd-kit/*` peer dependencies move from `^0.4.0` to `^0.5.0`; upgrade
  your `@dnd-kit/*` packages alongside snapgrid. No snapgrid API changes. dnd-kit 0.5 brings keyboard
  shortcuts that respect keyboard layouts, smoother drag starts, and less style recalculation at the
  start and end of drags on large pages.

### Patch Changes

- Updated dependencies [7a885a4]
  - @snapgridjs/dnd@0.12.0
  - @snapgridjs/core@0.12.0

## 0.11.0

### Minor Changes

- 33cfff5: Touch drags now arm on a hold instead of on movement, so a swipe over a tile scrolls the page again

  Mobile scrolling was broken for any grid inside a scrollable page: every touch that landed on a tile
  was captured by the drag sensor, so the list could not be swiped. Two things caused it, and both are
  fixed:

  - The item sensors replaced dnd-kit's activation constraints (which include a 250 ms touch delay)
    with a flat `threshold` distance, so 3 px of finger movement started a drag and `preventDefault`ed
    the `touchmove`. Touch now gets a hold constraint; the mouse and the pen keep `threshold`.
  - Tiles and resize handles set `touch-action: none`, which stops the browser from starting a scroll
    from any touch on them regardless of the sensors. Both are `touch-action: pan-y` now.

  New `dragConfig.touchHold` (ms, default `250`) tunes the hold — set it to `0` for the previous
  behaviour, where touch drags on movement like the mouse and tiles keep `touch-action: none` (a swipe
  on a tile then drags it instead of scrolling, since the page scroll and the drag would otherwise run
  at once).

### Patch Changes

- Updated dependencies [33cfff5]
  - @snapgridjs/dnd@0.11.0
  - @snapgridjs/core@0.11.0

## 0.10.0

### Patch Changes

- @snapgridjs/core@0.10.0
- @snapgridjs/dnd@0.10.0

## 0.9.1

### Patch Changes

- Updated dependencies [6a48e22]
  - @snapgridjs/dnd@0.9.1
  - @snapgridjs/core@0.9.1

## 0.9.0

### Minor Changes

- 341d0d5: Add `@snapgridjs/svelte`, a Svelte 5 binding for snapgrid that mirrors `@snapgridjs/react` on the shared, framework-free engine (`@snapgridjs/core` + `@snapgridjs/dnd`).

  It ships headless factories (`createGridContainer`, `createGridItem`, `createGridPlaceholder`, `createGridResizeHandle`, `createContainerWidth`, `createResponsiveLayout`, `resolveController`) and drop-in components (`GridLayout`, `GridItem`, `GridPlaceholder`, `ResponsiveGridLayout`, `SnapGridGroup`), delivering the same controlled drag, resize, compaction, cross-grid, and nesting behaviour as the React binding — built on `@dnd-kit/svelte`. Requires Svelte 5 (runes).

### Patch Changes

- 65bebeb: Refresh package READMEs for the Svelte release. `@snapgridjs/svelte` now ships a README (install, headless quick start, and the turnkey `<GridLayout>`); the React, core, dnd, and extras READMEs document the Svelte binding alongside React; and documentation links that moved under `/react` and `/svelte` are corrected.
- Updated dependencies [65bebeb]
  - @snapgridjs/core@0.9.0
  - @snapgridjs/dnd@0.9.0
