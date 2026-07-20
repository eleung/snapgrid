<script lang="ts">
  import { type Layout, createContainerWidth, createGridItem } from "@snapgridjs/svelte";
  import { NESTED_INNER_GRID } from "./demo-config";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // The outer "panel" tile, holding the inner grid. `attachHandle` makes the panel
  // drag only from its header — so grabbing an inner tile never drags the whole panel.
  // The inner grid uses HeadlessGridHost (not HeadlessGrid) so it shares the outer
  // grid's provider/manager — tiles can be dragged between the inner and outer grids;
  // innermost-grid collision keeps an inner drag scoped to it. Mirrors React.
  let {
    id,
    group,
    inner,
    onInnerChange,
  }: { id: string; group: string; inner: Layout; onInnerChange: (next: Layout) => void } = $props();

  // svelte-ignore state_referenced_locally
  const tile = createGridItem({ id, group });
  const innerWidth = createContainerWidth({ initialWidth: 440 });
</script>

<div {@attach tile.attach} style={tile.style} class="dg-cell">
  <div class="dg-nest">
    <div class="dg-nest__head" {@attach tile.attachHandle}>
      <span class="dg-grip">⠿</span> Nested board
    </div>
    <div class="dg-nest__body">
      <div {@attach innerWidth.attach}>
        <HeadlessGridHost
          layout={inner}
          width={innerWidth.width}
          onLayoutChange={onInnerChange}
          options={{ gridConfig: NESTED_INNER_GRID, isResizable: false }}
        >
          {#snippet content(it)}
            <div class="dg-nest__tile">{it.i}</div>
          {/snippet}
        </HeadlessGridHost>
      </div>
    </div>
  </div>
</div>
