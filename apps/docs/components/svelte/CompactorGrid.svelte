<script lang="ts">
  import { gravityCompactor, masonryCompactor, shelfCompactor } from "@snapgridjs/extras";
  import {
    type Compactor,
    type Layout,
    createContainerWidth,
    horizontalCompactor,
    noCompactor,
    verticalCompactor,
  } from "@snapgridjs/svelte";
  import { GRID, PACK, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // Swap the packing algorithm at runtime. vertical/horizontal come from the core;
  // masonry/gravity/shelf from @snapgridjs/extras; "none" leaves tiles where dropped.
  const PACKERS: Record<string, Compactor> = {
    vertical: verticalCompactor,
    horizontal: horizontalCompactor,
    masonry: masonryCompactor,
    gravity: gravityCompactor,
    shelf: shelfCompactor,
    none: noCompactor,
  };
  let packer = $state("vertical");
  let layout = $state<Layout>(PACK);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
  const compactor = $derived(PACKERS[packer] ?? verticalCompactor);
</script>

<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
  {#each Object.keys(PACKERS) as name (name)}
    <button
      type="button"
      class="dg-btn"
      data-active={packer === name || undefined}
      onclick={() => {
        packer = name;
        layout = PACKERS[name]?.compact(layout, GRID.cols) ?? layout;
      }}
    >
      {name}
    </button>
  {/each}
</div>
<div {@attach width.attach}>
  <HeadlessGrid
    {layout}
    width={width.width}
    onLayoutChange={(next) => (layout = next)}
    options={{ gridConfig: GRID, compactor }}
  />
</div>
