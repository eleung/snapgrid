<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import AnchorTile from "./AnchorTile.svelte";
  import { GRID, STATIC, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // Toggle the "anchor" tile between LOCKED (static, can't move) and PINNED (static
  // but still draggable by its grip). Either way, the others flow around it. `view`
  // re-derives the anchor's isDraggable from `pinned`; drags commit to `layout`.
  let pinned = $state(false);
  let layout = $state<Layout>(STATIC);
  const view = $derived(
    layout.map((it) => (it.i === "anchor" ? { ...it, isDraggable: pinned } : it)),
  );
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div {@attach width.attach}>
  <HeadlessGrid
    layout={view}
    width={width.width}
    onLayoutChange={(next) => (layout = next)}
    options={{ gridConfig: GRID }}
    isCustom={(it) => it.i === "anchor"}
  >
    {#snippet tile(item, group)}
      <AnchorTile id={item.i} {group} {pinned} onTogglePin={() => (pinned = !pinned)} />
    {/snippet}
  </HeadlessGrid>
</div>
