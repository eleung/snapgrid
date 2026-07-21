<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import DemoTile from "./DemoTile.svelte";
  import { GRID, NESTED_INNER, NESTED_OUTER, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";
  import NestedPanelTile from "./NestedPanelTile.svelte";

  // A grid inside another grid's tile — they share one provider (a nested grid detects
  // the ancestor and doesn't mint a second manager), so a tile can be dragged between
  // the inner and outer grids. The panel renders as a custom tile so its header is the
  // drag handle; the other outer tiles fall back to the default tile.
  let outer = $state<Layout>(NESTED_OUTER);
  let inner = $state<Layout>(NESTED_INNER);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div {@attach width.attach}>
  <HeadlessGrid
    layout={outer}
    width={width.width}
    onLayoutChange={(next) => (outer = next)}
    options={{ gridConfig: GRID, isResizable: false }}
    isCustom={(it) => it.i === "panel"}
  >
    {#snippet tile(item, group)}
      <NestedPanelTile id={item.i} {group} {inner} onInnerChange={(next) => (inner = next)} />
    {/snippet}
    {#snippet content(it)}
      <DemoTile label={it.i.toUpperCase()} accent={it.i === "b"} />
    {/snippet}
  </HeadlessGrid>
</div>
