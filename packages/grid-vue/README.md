# @snapgridjs/vue

**A [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) v2 alternative, built on [dnd-kit](https://github.com/clauderic/dnd-kit) — for Vue 3.**

Draggable, resizable, responsive grid layouts for Vue — with pluggable packing and dragging tiles _between_ grids.

[![npm](https://img.shields.io/npm/v/@snapgridjs/vue.svg)](https://www.npmjs.com/package/@snapgridjs/vue)
[![License: MIT](https://img.shields.io/badge/license-MIT-c2410c.svg)](https://github.com/eleung/snapgrid/blob/main/LICENSE)

[**Documentation**](https://snapgrid.dev) ·
[React docs](https://snapgrid.dev/react/docs/getting-started) ·
[Svelte docs](https://snapgrid.dev/svelte/docs/getting-started)

> The Vue binding of snapgrid. Same framework-free core + dnd-kit engine as [`@snapgridjs/react`](https://www.npmjs.com/package/@snapgridjs/react) and [`@snapgridjs/svelte`](https://www.npmjs.com/package/@snapgridjs/svelte) — a grid behaves identically whichever framework renders it.

> **Vue guides are still being written.** The quick start below is complete and current. Until the Vue pages land on [snapgrid.dev](https://snapgrid.dev), the [React](https://snapgrid.dev/react/docs/getting-started) and [Svelte](https://snapgrid.dev/svelte/docs/getting-started) guides describe the same engine, options and behaviour — only the binding syntax differs.

## Why snapgrid

- **Controlled & predictable** — you own the layout array; every change comes back through `onLayoutChange`. No hidden state.
- **Headless-first** — compose `useGridContainer` + composables under a dnd-kit `DragDropProvider` for full control of your markup — or drop in the turnkey `<GridLayout>` when you don't need that. Ships **no CSS**.
- **Vue 3 native** — composables returning refs and function refs; tiles declare a `group`, like a dnd-kit sortable. Fine-grained reactivity, nothing to memoize.
- **Pluggable packing** — `vertical` / `horizontal` / `none`, plus `masonry` / `gravity` / `shelf` from [`@snapgridjs/extras`](https://www.npmjs.com/package/@snapgridjs/extras), or your own `Compactor`.
- **Cross-grid dragging** — wrap grids in a `<SnapGridGroup>` and drag tiles between them.
- **Nested grids** — drop a grid inside a tile of another and drag tiles between levels; isolate a sub-grid with its own provider when you want it contained.
- **dnd-kit interop** — drag between a grid and a dnd-kit `useSortable` list or board (cards in, tiles out, both reorder) under one provider, via `snapMove`.
- **Responsive** — per-breakpoint layouts with `<ResponsiveGridLayout>`.
- **SSR-safe** (Nuxt) and **TypeScript-first** (types included).

## Install

```sh
pnpm add @snapgridjs/vue @dnd-kit/vue @dnd-kit/dom
```

Requires **Vue 3.5+** (`vue@^3.5`, a peer dependency). `@snapgridjs/extras` (masonry/gravity/shelf packers) is optional.

## Quick start

snapgrid is **headless-first**: you compose composables with a dnd-kit `DragDropProvider` and render your own markup. Vue resolves `inject` from the parent chain, so the grid host must live in a **child component** of the provider — never in the component that renders it.

```vue
<!-- Board.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { DragDropProvider, useContainerWidth } from "@snapgridjs/vue";
import Surface from "./Surface.vue";

const layout = ref([
  { i: "a", x: 0, y: 0, w: 4, h: 2 },
  { i: "b", x: 4, y: 0, w: 4, h: 2 },
  { i: "c", x: 8, y: 0, w: 4, h: 2 },
]);
// Composables return refs — destructure them so the template auto-unwraps each one.
const { width, setRef } = useContainerWidth();
</script>

<template>
  <!-- DragDropProvider is the outermost element; Surface calls useGridContainer
       inside it, so it resolves the provider's dnd-kit manager. -->
  <div :ref="setRef">
    <DragDropProvider>
      <Surface :layout="layout" :width="width" @layout-change="layout = $event" />
    </DragDropProvider>
  </div>
</template>
```

```vue
<!-- Surface.vue — the grid host; exposes the grid's `group`. -->
<script setup lang="ts">
import { useGridContainer, type Layout } from "@snapgridjs/vue";
import Tile from "./Tile.vue";

const props = defineProps<{ layout: Layout; width: number }>();
const emit = defineEmits<{ layoutChange: [Layout] }>();

const { setRef, style, group } = useGridContainer(() => ({
  layout: props.layout,
  width: props.width,
  onLayoutChange: (next) => emit("layoutChange", next),
}));
</script>

<template>
  <div :ref="setRef" :style="style">
    <Tile v-for="it in layout" :key="it.i" :id="it.i" :group="group" />
  </div>
</template>
```

```vue
<!-- Tile.vue — each tile resolves its grid by `group`, like a dnd-kit sortable. -->
<script setup lang="ts">
import { useGridItem } from "@snapgridjs/vue";

const props = defineProps<{ id: string; group: string }>();
const { setRef, style } = useGridItem({ id: props.id, group: props.group });
</script>

<template>
  <div :ref="setRef" :style="style" class="tile">{{ id }}</div>
</template>
```

**Prefer a ready-made component?** The turnkey `<GridLayout>` wraps these same composables (and supplies the provider) — pass an `item` scoped slot and you're done:

```vue
<GridLayout :layout="layout" :width="width" :on-layout-change="(next) => (layout = next)">
  <template #item="{ item }">
    <div class="tile">{{ item.i }}</div>
  </template>
</GridLayout>
```

The `item` slot receives the item's **committed** layout entry. Inside a tile, `useGridItem().item` gives the live (reflowed) entry during a drag.

## License

MIT © Edmond Leung
