# @snapgridjs/react

**A [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v2 alternative, built on [dnd-kit](https://github.com/clauderic/dnd-kit).**

Draggable, resizable, responsive grid layouts for React — with pluggable packing and dragging tiles _between_ grids.

[![npm](https://img.shields.io/npm/v/@snapgridjs/react.svg)](https://www.npmjs.com/package/@snapgridjs/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

[**Documentation**](https://snapgrid.dev) ·
[Getting Started](https://snapgrid.dev/docs/getting-started) ·
[Examples](https://snapgrid.dev/examples) ·
[API](https://snapgrid.dev/docs/api/overview)

## Why snapgrid

- **Controlled & predictable** — you own the layout array; every change comes back through `onLayoutChange`. No hidden state.
- **Headless-first** — compose `useGridContainer` + hooks under a dnd-kit `DragDropProvider` for full control of your markup — or drop in the turnkey [`<GridLayout>`](https://snapgrid.dev/docs/guides/component-layer) (react-grid-layout-style) when you don't need that. Ships **no CSS**.
- **Pluggable packing** — `vertical` / `horizontal` / `none`, plus `masonry` / `gravity` / `shelf` from [`@snapgridjs/extras`](https://www.npmjs.com/package/@snapgridjs/extras), or your own `Compactor`.
- **Cross-grid dragging** — wrap grids in a `<SnapGridGroup>` and drag tiles between them.
- **Nested grids** — drop a grid inside a tile of another grid and drag tiles between levels; isolate a sub-grid with its own provider when you want it contained.
- **dnd-kit interop** — drag between a grid and a dnd-kit `useSortable` list or board (cards in, tiles out, both reorder) under one provider, via `snapMove`.
- **Responsive** — per-breakpoint layouts with `<ResponsiveGridLayout>`.
- **Keyboard accessible** — Enter/Space to pick up, arrow keys to move, Esc to cancel.
- **SSR-safe** and **TypeScript-first** (types included).

## Install

```sh
pnpm add @snapgridjs/react @dnd-kit/react @dnd-kit/dom
```

`@snapgridjs/extras` (masonry/gravity/shelf packers) is optional.

## Quick start

snapgrid is **headless-first**: you compose hooks with a dnd-kit `DragDropProvider` and render your own markup.

```tsx
import { DragDropProvider } from "@dnd-kit/react";
import { type Layout, useContainerWidth, useGridContainer, useGridItem } from "@snapgridjs/react";
import { useState } from "react";

export function Board() {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);

  // You supply the dnd-kit provider; useGridContainer runs inside it (in Surface).
  return (
    <div ref={containerRef}>
      <DragDropProvider>
        <Surface layout={layout} width={width} onLayoutChange={setLayout} />
      </DragDropProvider>
    </div>
  );
}

function Surface({
  layout,
  width,
  onLayoutChange,
}: { layout: Layout; width: number; onLayoutChange: (next: Layout) => void }) {
  const { containerProps, group } = useGridContainer({ layout, width, onLayoutChange });
  return (
    <div {...containerProps}>
      {layout.map((it) => (
        <Tile key={it.i} id={it.i} group={group} />
      ))}
    </div>
  );
}

function Tile({ id, group }: { id: string; group: string }) {
  const { ref, style } = useGridItem(id, group);
  return (
    <div ref={ref} style={style} className="tile">
      {id}
    </div>
  );
}
```

**Prefer a ready-made component?** The turnkey [`<GridLayout>`](https://snapgrid.dev/docs/guides/component-layer) wraps these same hooks (and supplies the provider) in a react-grid-layout-style API:

```tsx
<GridLayout layout={layout} width={width} onLayoutChange={setLayout}>
  {layout.map((item) => (
    <div key={item.i} className="tile">
      {item.i}
    </div>
  ))}
</GridLayout>
```

→ Full walkthrough in [**Getting Started**](https://snapgrid.dev/docs/getting-started).

## License

MIT © Edmond Leung
