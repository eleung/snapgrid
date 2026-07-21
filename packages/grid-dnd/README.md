# @snapgridjs/dnd

The framework-agnostic dnd-kit engine for [snapgrid](https://github.com/eleung/snapgrid) — the drag, resize, and cross-grid orchestration that the [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react) and [`@snapgridjs/svelte`](https://www.npmjs.com/package/@snapgridjs/svelte) bindings are built on, with no framework dependency of its own.

[![npm](https://img.shields.io/npm/v/@snapgridjs/dnd.svg)](https://www.npmjs.com/package/@snapgridjs/dnd)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

> **Most users want a framework binding — [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react) or [`@snapgridjs/svelte`](https://www.npmjs.com/package/@snapgridjs/svelte) — not this package.** `@snapgridjs/dnd` is the shared engine those bindings compose. Reach for it directly only to build a binding for another framework (Vue, Solid, vanilla) on top of the same engine.

## Install

```sh
pnpm add @snapgridjs/dnd @dnd-kit/dom
```

`@dnd-kit/dom`, `@dnd-kit/abstract`, and `@dnd-kit/collision` are peer dependencies (so there's a single shared copy); `@snapgridjs/core` comes in automatically.

## What's here

One per-manager engine, plus the pieces a binding wires up:

- **`attachEngine(manager)`** — attach the drag/resize/receive engine to a dnd-kit manager (ref-counted; one per manager). It listens to the manager's drag lifecycle and drives every registered grid — including cross-grid hand-off.
- **`GridController`** — the observable per-grid render bridge. A binding writes per-grid config into it and subscribes to the rendered layout / per-tile snapshots (e.g. via `useSyncExternalStore`).
- **`registerController` / `getController`** — resolve a grid's controller by id, scoped to a manager.
- **Interaction helpers** — `gridCollisionDetector`, `SnapToGrid`, `buildItemSensors`, `domElement`, and the pure `dragFlow` decision functions (`classifyDrop`, `receiveCell`, …).
- **`snapMove(layout, event, ctx)`** — the consumer-facing reducer for dnd-kit ecosystem interop (drag a `useSortable` card into a grid, or a tile between a grid and a sortable list); also re-exported from `@snapgridjs/react` and `@snapgridjs/svelte`.
- **Config & event types** — `DragConfig`, `ResizeConfig`, `DropConfig`, `GridDropData`, `GridEventCallback` (also re-exported from `@snapgridjs/react` and `@snapgridjs/svelte`).

The layout math — compaction, geometry, move/resize, and the drag-session state machine — lives in [`@snapgridjs/core`](https://www.npmjs.com/package/@snapgridjs/core); this package adds the dnd-kit interaction layer on top, and the framework bindings add rendering.

## Stability

The binding-author surface is still settling as the first non-React bindings are built — treat these exports as semi-stable.

## License

MIT
