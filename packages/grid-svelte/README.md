# @snapgridjs/svelte

**A [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v2 alternative, built on [dnd-kit](https://github.com/clauderic/dnd-kit) — for Svelte 5.**

Draggable, resizable, responsive grid layouts for Svelte — with pluggable packing and dragging tiles _between_ grids.

[![npm](https://img.shields.io/npm/v/@snapgridjs/svelte.svg)](https://www.npmjs.com/package/@snapgridjs/svelte)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

[**Documentation**](https://snapgrid.dev/svelte/docs/getting-started) ·
[Getting Started](https://snapgrid.dev/svelte/docs/getting-started) ·
[Examples](https://snapgrid.dev/svelte/examples) ·
[API](https://snapgrid.dev/svelte/docs/api/overview)

> The Svelte binding of snapgrid. Same framework-free core + dnd-kit engine as [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react) — a grid behaves identically whichever framework renders it.

## Why snapgrid

- **Controlled & predictable** — you own the layout array; every change comes back through `onLayoutChange`. No hidden state.
- **Headless-first** — compose `createGridContainer` + factories under a dnd-kit `DragDropProvider` for full control of your markup — or drop in the turnkey [`<GridLayout>`](https://snapgrid.dev/svelte/docs/guides/component-layer) when you don't need that. Ships **no CSS**.
- **Svelte 5 native** — runes + attachments (`{@attach}`); tiles declare a `group`, like a dnd-kit sortable. Fine-grained reactivity, nothing to memoize.
- **Pluggable packing** — `vertical` / `horizontal` / `none`, plus `masonry` / `gravity` / `shelf` from [`@snapgridjs/extras`](https://www.npmjs.com/package/@snapgridjs/extras), or your own `Compactor`.
- **Cross-grid dragging** — wrap grids in a `<SnapGridGroup>` and drag tiles between them.
- **Nested grids** — drop a grid inside a tile of another and drag tiles between levels; isolate a sub-grid with its own provider when you want it contained.
- **dnd-kit interop** — drag between a grid and a dnd-kit `createSortable` list or board (cards in, tiles out, both reorder) under one provider, via `snapMove`.
- **Responsive** — per-breakpoint layouts with `<ResponsiveGridLayout>`.
- **SSR-safe** (SvelteKit) and **TypeScript-first** (types included).

## Install

```sh
pnpm add @snapgridjs/svelte @dnd-kit/svelte @dnd-kit/dom
```

Requires **Svelte 5** (`svelte@^5.29`, a peer dependency). `@snapgridjs/extras` (masonry/gravity/shelf packers) is optional.

## Quick start

snapgrid is **headless-first**: you compose factories with a dnd-kit `DragDropProvider` and render your own markup. Because a tile's `createGridItem` must run inside the provider, the grid host lives in a child component.

```svelte
<!-- Board.svelte -->
<script lang="ts">
  import { DragDropProvider, createContainerWidth } from "@snapgridjs/svelte";
  import Surface from "./Surface.svelte";

  let layout = $state([
    { i: "a", x: 0, y: 0, w: 4, h: 2 },
    { i: "b", x: 4, y: 0, w: 4, h: 2 },
    { i: "c", x: 8, y: 0, w: 4, h: 2 },
  ]);
  const width = createContainerWidth();
</script>

<!-- DragDropProvider is the outermost element; Surface runs createGridContainer
     inside it, so it resolves the provider's dnd-kit manager. -->
<div {@attach width.attach}>
  <DragDropProvider>
    <Surface {layout} width={width.width} onLayoutChange={(next) => (layout = next)} />
  </DragDropProvider>
</div>
```

```svelte
<!-- Surface.svelte — the grid host; returns the grid's `group`. -->
<script lang="ts">
  import { createGridContainer } from "@snapgridjs/svelte";
  import Tile from "./Tile.svelte";

  let { layout, width, onLayoutChange } = $props();
  const container = createGridContainer(() => ({ layout, width, onLayoutChange }));
</script>

<div {@attach container.attach} style={container.style}>
  {#each layout as it (it.i)}
    <Tile id={it.i} group={container.group} />
  {/each}
</div>
```

```svelte
<!-- Tile.svelte — each tile resolves its grid by `group`, like a dnd-kit sortable. -->
<script lang="ts">
  import { createGridItem } from "@snapgridjs/svelte";

  let { id, group } = $props();
  const tile = createGridItem({ id, group });
</script>

<div {@attach tile.attach} style={tile.style} class="tile">{id}</div>
```

**Prefer a ready-made component?** The turnkey [`<GridLayout>`](https://snapgrid.dev/svelte/docs/guides/component-layer) wraps these same factories (and supplies the provider) — pass an `item` snippet and you're done:

```svelte
<GridLayout {layout} {width} onLayoutChange={(next) => (layout = next)}>
  {#snippet item(it)}
    <div class="tile">{it.i}</div>
  {/snippet}
</GridLayout>
```

→ Full walkthrough in [**Getting Started**](https://snapgrid.dev/svelte/docs/getting-started).

## License

MIT © Edmond Leung
