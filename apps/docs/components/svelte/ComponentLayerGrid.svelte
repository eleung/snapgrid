<script lang="ts">
  import { GridLayout, type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import DemoTile from "./DemoTile.svelte";
  import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";

  // The turnkey shell: <GridLayout> mints its own DragDropProvider and renders the
  // tiles, resize handles, and placeholder — no factories, no dnd-kit wiring. The rest
  // of the gallery is headless; this one demo shows the component layer.
  let layout = $state<Layout>(BASIC.slice(0, 4));
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div class="dg-cl" {@attach width.attach}>
  <GridLayout
    {layout}
    width={width.width}
    gridConfig={GRID}
    resizeConfig={{ handles: ["se"] }}
    onLayoutChange={(next) => (layout = next)}
  >
    {#snippet item(it)}
      <DemoTile label={it.i.toUpperCase()} meta={`${it.w}×${it.h}`} />
    {/snippet}
  </GridLayout>
</div>
