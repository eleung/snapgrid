# @snapgridjs/vue

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

### Minor Changes

- 0455f15: Add `@snapgridjs/vue` — the Vue 3 binding, built on `@dnd-kit/vue`.

  Composables (`useGridContainer`, `useGridItem`, `useGridPlaceholder`, `useGridResizeHandle`,
  `useResponsiveLayout`, `useContainerWidth`) plus the turnkey `GridLayout`,
  `ResponsiveGridLayout`, `GridItem`, `GridPlaceholder` and `SnapGridGroup` components.
  Same framework-free `@snapgridjs/core` + `@snapgridjs/dnd` engine as the React and Svelte
  bindings, so a grid behaves identically whichever framework renders it: cross-grid and
  nested dragging, keyboard a11y, resize handles, external drop, pluggable packing.

  Requires `vue@^3.5`. Components ship as render functions (no SFC toolchain needed to
  consume or build the package).

### Patch Changes

- @snapgridjs/core@0.10.0
- @snapgridjs/dnd@0.10.0
