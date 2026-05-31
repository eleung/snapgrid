# @snapgrid/react

**A [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v2 alternative, built on [dnd-kit](https://github.com/clauderic/dnd-kit).**

Draggable, resizable, responsive grid layouts for React — with pluggable packing and dragging tiles _between_ grids.

[![npm](https://img.shields.io/npm/v/@snapgrid/react.svg)](https://www.npmjs.com/package/@snapgrid/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

[**Documentation**](https://snapgrid.dev) ·
[Getting Started](https://snapgrid.dev/docs/getting-started) ·
[Examples](https://snapgrid.dev/examples) ·
[API](https://snapgrid.dev/docs/api/overview)

## Why snapgrid

- **Controlled & predictable** — you own the layout array; every change comes back through `onLayoutChange`. No hidden state.
- **Headless or drop-in** — `<GridLayout>` for the common case, or `SnapGridProvider` + hooks for full control of the markup. Ships **no CSS**.
- **Pluggable packing** — `vertical` / `horizontal` / `none`, plus `masonry` / `gravity` / `shelf` from [`@snapgrid/extras`](https://www.npmjs.com/package/@snapgrid/extras), or your own `Compactor`.
- **Cross-grid dragging** — wrap grids in a `<SnapGridGroup>` and drag tiles between them.
- **Nested grids** — drop a grid inside a tile of another grid; each level keeps its own isolated drag session.
- **Responsive** — per-breakpoint layouts with `<ResponsiveGridLayout>`.
- **Keyboard accessible** — Enter/Space to pick up, arrow keys to move, Esc to cancel.
- **SSR-safe** and **TypeScript-first** (types included).

## Install

```sh
pnpm add @snapgrid/react @dnd-kit/react @dnd-kit/dom
```

`@snapgrid/extras` (masonry/gravity/shelf packers) is optional.

## Quick start

```tsx
import { GridLayout, useContainerWidth, type Layout } from "@snapgrid/react";
import { useState } from "react";

export function Board() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);

  return (
    <div ref={containerRef}>
      <GridLayout layout={layout} width={width} onLayoutChange={setLayout}>
        {layout.map((item) => (
          <div key={item.i} className="tile">
            {item.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
```

→ Full walkthrough in [**Getting Started**](https://snapgrid.dev/docs/getting-started).

## License

MIT © Edmond Leung
