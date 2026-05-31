# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) from 1.0 onward.

## [0.1.0] - 2026-05-31

Initial public release.

### Added

- `@snapgrid/react`: controlled `GridLayout`, `ResponsiveGridLayout`, `GridItem`, `GridPlaceholder`,
  `GridDragOverlay`, and the headless `SnapGridProvider` + hooks.
- `SnapGridGroup` for dragging tiles between grids; external-drop support via `dropConfig` / `onDrop`.
- `@snapgrid/extras`: `masonry`, `gravity`, `shelf` packers (plus `wrap` and fast compactors).
- `useContainerWidth`, `useResponsiveLayout`, and opt-in grid snapping (`dragConfig.snapToGrid`).
- Keyboard dragging: focus a tile, Enter/Space to pick up, arrow keys to move a cell at a time,
  Enter/Space to drop, Escape to cancel.
- Documentation site (`apps/docs`) with guides, API reference, and live examples — including a
  nested-grids guide and a real-world showcase dashboard.

[0.1.0]: https://github.com/eleung/snapgrid/releases/tag/v0.1.0
