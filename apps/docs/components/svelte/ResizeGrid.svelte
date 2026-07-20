<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import DemoTile from "./DemoTile.svelte";
  import { GRID, RESIZE, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // Per-item resize constraints: drag any corner; minW/maxW/minH/maxH are enforced.
  // The tile labels double as their constraint ("min 2×1", "max 6×3", "free").
  let layout = $state<Layout>(RESIZE);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div {@attach width.attach}>
  <HeadlessGrid
    {layout}
    width={width.width}
    onLayoutChange={(next) => (layout = next)}
    options={{ gridConfig: GRID, resizeConfig: { handles: ["se"] } }}
    resizable
  >
    {#snippet content(it)}
      <DemoTile label={it.i} meta={`${it.w}×${it.h}`} />
    {/snippet}
  </HeadlessGrid>
</div>
