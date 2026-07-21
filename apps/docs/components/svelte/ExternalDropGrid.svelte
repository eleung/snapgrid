<script lang="ts">
  import { type Layout, SnapGridGroup } from "@snapgridjs/svelte";
  import { PALETTE } from "./demo-config";
  import DropTargetGrid from "./DropTargetGrid.svelte";
  import PaletteChip from "./PaletteChip.svelte";

  // A palette of draggable chips beside a drop-enabled grid, under one shared provider
  // (SnapGridGroup) so a chip can be dropped into the grid — which synthesizes a new
  // item of the chip's size. Mirrors the React external-drop demo.
  let layout = $state<Layout>([{ i: "seed", x: 0, y: 0, w: 3, h: 2 }]);
</script>

<SnapGridGroup>
  <div class="dg-gridrow">
    <div class="dg-subgrid dg-subgrid--auto">
      <span class="dg-subgrid__label">Palette</span>
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        {#each PALETTE as c (c.id)}
          <PaletteChip id={c.id} label={c.label} w={c.w} h={c.h} />
        {/each}
      </div>
    </div>
    <DropTargetGrid {layout} onLayoutChange={(next) => (layout = next)} />
  </div>
</SnapGridGroup>
