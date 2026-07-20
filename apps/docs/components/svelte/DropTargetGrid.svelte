<script lang="ts">
  import { type Layout, type LayoutItem, createContainerWidth } from "@snapgridjs/svelte";
  import { EXTERNAL_GRID } from "./demo-config";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // The drop target: a headless grid with dropConfig enabled. The engine synthesizes
  // the dropped item; onDrop relabels its ugly minted id (`<gridId>-dropped-N`) to a
  // short one. No own provider — the enclosing SnapGridGroup shares it with the palette.
  let { layout, onLayoutChange }: { layout: Layout; onLayoutChange: (next: Layout) => void } =
    $props();

  const width = createContainerWidth({ initialWidth: 684 });
  let dropCount = 0;
</script>

<div class="dg-subgrid">
  <span class="dg-subgrid__label">Grid (drop here)</span>
  <div {@attach width.attach}>
    <HeadlessGridHost
      {layout}
      width={Math.max(180, width.width)}
      {onLayoutChange}
      options={{
        gridConfig: EXTERNAL_GRID,
        dropConfig: { enabled: true, defaultItem: { w: 2, h: 2 } },
        onDrop: (next: Layout, item: LayoutItem) => {
          dropCount += 1;
          const shortId = `t${dropCount}`;
          onLayoutChange(next.map((it) => (it.i === item.i ? { ...it, i: shortId } : it)));
        },
      }}
    />
  </div>
</div>
