<script lang="ts">
  import type { Layout } from "@snapgridjs/core";
  import type { DragConfig } from "@snapgridjs/dnd";
  import { createGridContainer } from "../../index.js";
  import Tile from "./Tile.svelte";

  let { layout, width, dragConfig }: { layout: Layout; width: number; dragConfig?: DragConfig } =
    $props();

  const container = createGridContainer(() => ({
    layout,
    width,
    dragConfig,
    gridConfig: { cols: 4, rowHeight: 100, margin: [10, 10], containerPadding: [0, 0] },
  }));
</script>

<div
  class="headless-surface"
  data-group={container.group}
  {@attach container.attach}
  style={container.style}
>
  {#each layout as it (it.i)}
    <Tile id={it.i} group={container.group} />
  {/each}
</div>
