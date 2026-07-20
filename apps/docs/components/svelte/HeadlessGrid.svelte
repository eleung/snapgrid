<script lang="ts">
  import {
    DragDropProvider,
    type Layout,
    type LayoutItem,
    type UseGridControllerOptions,
  } from "@snapgridjs/svelte";
  import type { Snippet } from "svelte";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // The headless wiring every single-grid demo shares: a dnd-kit DragDropProvider
  // wrapping the grid host. The provider is the OUTERMOST element — createGridContainer
  // must run inside it (it registers the grid's controller on the provider's manager),
  // so the host lives in a child component, not in this body. Mirrors React `HeadlessGrid`.
  let {
    layout,
    width,
    onLayoutChange,
    options,
    resizable = false,
    id,
    content,
    tile,
    isCustom,
  }: {
    layout: Layout;
    width: number;
    onLayoutChange: (next: Layout) => void;
    options?: Omit<UseGridControllerOptions, "id" | "layout" | "width" | "onLayoutChange">;
    resizable?: boolean;
    id?: string;
    content?: Snippet<[LayoutItem]>;
    tile?: Snippet<[LayoutItem, string]>;
    isCustom?: (item: LayoutItem) => boolean;
  } = $props();
</script>

<DragDropProvider>
  <HeadlessGridHost
    {layout}
    {width}
    {onLayoutChange}
    {options}
    {resizable}
    {id}
    {content}
    {tile}
    {isCustom}
  />
</DragDropProvider>
