<script lang="ts">
  import { DragDropProvider, type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import { GRID, HANDLE, STAGE_WIDTH } from "./demo-config";
  import HandleTile from "./HandleTile.svelte";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // Drag only by the grip; the rest of the tile stays interactive. Headless: every
  // tile is a custom DragHandleTile (createGridItem + attachHandle grip). `isResizable`
  // is off so a corner never starts a resize on these bar-headed tiles. containerWidth
  // is measured outside the provider and fed in; mirrors the React drag-handle demo.
  let layout = $state<Layout>(HANDLE);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div {@attach width.attach}>
  <DragDropProvider>
    <HeadlessGridHost
      {layout}
      width={width.width}
      onLayoutChange={(next) => (layout = next)}
      options={{ gridConfig: GRID, isResizable: false }}
      isCustom={() => true}
    >
      {#snippet tile(item, group)}
        <HandleTile id={item.i} {group} />
      {/snippet}
    </HeadlessGridHost>
  </DragDropProvider>
</div>
