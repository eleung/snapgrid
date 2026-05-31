# @snapgridjs/core

Framework-agnostic layout engine for [snapgrid](https://github.com/eleung/snapgrid) — a thin adapter over `react-grid-layout/core` that owns the math: collision, compaction, move/resize, and responsive breakpoint resolution.

[![npm](https://img.shields.io/npm/v/@snapgridjs/core.svg)](https://www.npmjs.com/package/@snapgridjs/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

> **Most users want [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react), not this package.** `@snapgridjs/core` is the headless engine the React bindings are built on. Reach for it directly only if you're building your own bindings or driving layout calculations without React.

## Install

```sh
pnpm add @snapgridjs/core
```

## What's here

Pure functions and types — no React, no DOM:

- **Layout ops** — `moveElement`, `moveItemWithCompactor`, `resizeItemWithCompactor`, `insertItemWithCompactor`, `removeItemWithCompactor`.
- **Compactors** — `verticalCompactor`, `horizontalCompactor`, `noCompactor`, and `getCompactor`.
- **Positioning** — `calcXY`, `calcWH`, `calcGridItemPosition`, `toPositionParams`.
- **Drag sessions** — `beginDrag`, `dragTo`, `nudge`, `beginResize`, `dragResize`, `commitLayout`.
- **Responsive** — `getBreakpointFromWidth`, `findOrGenerateResponsiveLayout`.
- Core types: `Layout`, `LayoutItem`, `Compactor`, `DragSession`, `GridConfig`, and more.

→ See the [API reference](https://snapgrid.dev/docs/api/core).

## License

MIT © Edmond Leung
