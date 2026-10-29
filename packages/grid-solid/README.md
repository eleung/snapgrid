# @snapgridjs/solid

**A [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v2 alternative, built on [dnd-kit](https://github.com/clauderic/dnd-kit) — for SolidJS.**

Draggable, resizable, responsive grid layouts for Solid — with pluggable packing and dragging tiles _between_ grids.

[![npm](https://img.shields.io/npm/v/@snapgridjs/solid.svg)](https://www.npmjs.com/package/@snapgridjs/solid)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

[**Documentation**](https://snapgrid.dev/solid/docs/getting-started) ·
[Getting Started](https://snapgrid.dev/solid/docs/getting-started) ·
[Examples](https://snapgrid.dev/solid/examples) ·
[API](https://snapgrid.dev/solid/docs/api/overview)

> The Solid binding of snapgrid. Same framework-free core + dnd-kit engine as [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react), [`@snapgridjs/svelte`](https://www.npmjs.com/package/@snapgridjs/svelte) and [`@snapgridjs/vue`](https://www.npmjs.com/package/@snapgridjs/vue) — a grid behaves identically whichever framework renders it.

## Why snapgrid

- **Controlled & predictable** — you own the layout array; every change comes back through `onLayoutChange`. No hidden state.
- **Headless-first** — compose `useGridContainer` + hooks under a dnd-kit `DragDropProvider` for full control of your markup — or drop in the turnkey [`<GridLayout>`](https://snapgrid.dev/solid/docs/guides/component-layer) when you don't need that. Ships **no CSS**.
- **Solid native** — hooks returning accessors and ref callbacks; tiles declare a `group`, like a dnd-kit sortable. Fine-grained updates: a drag re-runs only the tiles whose cell changed.
- **Pluggable packing** — `vertical` / `horizontal` / `none`, plus `masonry` / `gravity` / `shelf` from [`@snapgridjs/extras`](https://www.npmjs.com/package/@snapgridjs/extras), or your own `Compactor`.
- **Cross-grid dragging** — wrap grids in a `<SnapGridGroup>` and drag tiles between them.
- **Nested grids** — drop a grid inside a tile of another and drag tiles between levels; isolate a sub-grid with its own provider when you want it contained.
- **dnd-kit interop** — drag between a grid and a dnd-kit `useSortable` list or board (cards in, tiles out, both reorder) under one provider, via `snapMove`.
- **Responsive** — per-breakpoint layouts with `<ResponsiveGridLayout>`.
- **SSR-safe** (SolidStart) and **TypeScript-first** (types included).

## Install

```sh
pnpm add @snapgridjs/solid @dnd-kit/solid @dnd-kit/dom
```

Requires **Solid 1.8+** (`solid-js@^1.8`, a peer dependency). `@snapgridjs/extras` (masonry/gravity/shelf packers) is optional.

## Quick start

snapgrid is **headless-first**: you compose hooks with a dnd-kit `DragDropProvider` and render your own markup. Solid resolves context from the owner chain, so the grid host must live in a **component rendered inside** the provider — never in the component that renders it.

```tsx
import {
  DragDropProvider,
  type Layout,
  useContainerWidth,
  useGridContainer,
  useGridItem,
} from "@snapgridjs/solid";
import { For, createSignal } from "solid-js";

export function Board() {
  const { width, ref } = useContainerWidth();
  const [layout, setLayout] = createSignal<Layout>([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);

  // You supply the dnd-kit provider; useGridContainer runs inside it (in Surface).
  return (
    <div ref={ref}>
      <DragDropProvider>
        <Surface layout={layout()} width={width()} onLayoutChange={setLayout} />
      </DragDropProvider>
    </div>
  );
}

// The grid host. The options getter keeps the grid tracking your live props.
function Surface(props: { layout: Layout; width: number; onLayoutChange: (l: Layout) => void }) {
  const grid = useGridContainer(() => ({
    layout: props.layout,
    width: props.width,
    onLayoutChange: props.onLayoutChange,
  }));
  return (
    <div ref={grid.ref} style={grid.style()}>
      {/* Iterate ids, not entries: <For> keys by identity, and a commit replaces entries. */}
      <For each={props.layout.map((it) => it.i)}>
        {(id) => <Tile id={id} group={grid.group()} />}
      </For>
    </div>
  );
}

// Each tile resolves its grid by `group`, like a dnd-kit sortable.
function Tile(props: { id: string; group: string }) {
  const tile = useGridItem({ id: props.id, group: props.group });
  return (
    <div ref={tile.ref} style={tile.style()} class="tile">
      {props.id}
    </div>
  );
}
```

**Prefer a ready-made component?** The turnkey [`<GridLayout>`](https://snapgrid.dev/solid/docs/guides/component-layer) wraps these same hooks (and supplies the provider) — pass a render-prop child and you're done:

```tsx
<GridLayout layout={layout()} width={width()} onLayoutChange={setLayout}>
  {(item) => <div class="tile">{item().i}</div>}
</GridLayout>
```

The child receives an accessor for the item's **committed** layout entry, and runs once per tile. For the live (reflowed) entry during a drag, build headless tiles with `useGridItem` — its `item()` accessor tracks the preview.

→ Full walkthrough in [**Getting Started**](https://snapgrid.dev/solid/docs/getting-started).

## License

MIT © Edmond Leung
