<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // Toggle whether the dragged tile glides freely with the pointer or snaps to whole
  // cells (dragConfig.snapToGrid).
  let snap = $state(false);
  let layout = $state<Layout>(BASIC.slice(0, 4));
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.8rem">
  <button type="button" class="dg-btn" data-active={!snap || undefined} onclick={() => (snap = false)}>
    glide (default)
  </button>
  <button type="button" class="dg-btn" data-active={snap || undefined} onclick={() => (snap = true)}>
    snapToGrid
  </button>
</div>
<div {@attach width.attach}>
  <HeadlessGrid
    {layout}
    width={width.width}
    onLayoutChange={(next) => (layout = next)}
    options={{ gridConfig: GRID, dragConfig: { snapToGrid: snap } }}
  />
</div>
