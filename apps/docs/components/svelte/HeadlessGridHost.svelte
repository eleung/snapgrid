<script lang="ts">
  import {
    type Layout,
    type LayoutItem,
    type UseGridControllerOptions,
    createGridContainer,
  } from "@snapgridjs/svelte";
  import type { Snippet } from "svelte";
  import DemoTile from "./DemoTile.svelte";
  import GridPlaceholder from "./GridPlaceholder.svelte";
  import GridTile from "./GridTile.svelte";

  // The grid host — rendered inside a DragDropProvider (see HeadlessGrid, or a
  // shared SnapGridGroup/provider for multi-grid demos) so createGridContainer
  // resolves the right manager. Renders the surface, tiles, and the placeholder.
  // Mirrors the React `HeadlessGridHost` helper (demos.tsx): the headless wiring
  // every demo shares. `content` draws a tile's inner content (default: DemoTile);
  // `tile` (gated by `isCustom`) supplies a full custom positioned tile.
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
    // The per-grid config (gridConfig, dragConfig, compactor, dropConfig, accept…),
    // minus the controlled state the host threads itself.
    options?: Omit<UseGridControllerOptions, "id" | "layout" | "width" | "onLayoutChange">;
    resizable?: boolean;
    id?: string;
    content?: Snippet<[LayoutItem]>;
    tile?: Snippet<[LayoutItem, string]>;
    isCustom?: (item: LayoutItem) => boolean;
  } = $props();

  const container = createGridContainer(() => ({
    ...(id ? { id } : {}),
    layout,
    width,
    onLayoutChange,
    ...(options ?? {}),
  }));
</script>

<div {@attach container.attach} style={container.style} class="dg-grid">
  {#each layout as item (item.i)}
    {#if tile && isCustom?.(item)}
      {@render tile(item, container.group)}
    {:else}
      <GridTile id={item.i} group={container.group} {resizable}>
        {#if content}
          {@render content(item)}
        {:else}
          <DemoTile
            label={item.i.toUpperCase()}
            meta={`${item.w}×${item.h}`}
            isStatic={item.static ?? false}
          />
        {/if}
      </GridTile>
    {/if}
  {/each}
  <GridPlaceholder group={container.group} />
</div>
