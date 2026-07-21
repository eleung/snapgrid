<script lang="ts">
  import type { Layout } from "@snapgridjs/core";
  import { createGridContainer } from "../../index.js";
  import Tile from "./Tile.svelte";

  let { layout, width }: { layout: Layout; width: number } = $props();

  const container = createGridContainer(() => ({
    layout,
    width,
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
