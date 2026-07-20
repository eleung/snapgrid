<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import { CROSS } from "./demo-config";
  import HeadlessGridHost from "./HeadlessGridHost.svelte";

  // One grid of the cross-grid pair, in its own bordered card so the two are visibly
  // distinct. Width is measured from an inner div (no padding/border) so the surface
  // fits exactly. No DragDropProvider here — the enclosing SnapGridGroup provides the
  // shared one, so tiles can cross between the two grids. Mirrors React `CrossSubGrid`.
  let {
    label,
    layout,
    onLayoutChange,
  }: { label: string; layout: Layout; onLayoutChange: (next: Layout) => void } = $props();

  const width = createContainerWidth({ initialWidth: 371 });
</script>

<div class="dg-subgrid">
  <span class="dg-subgrid__label">{label}</span>
  <div {@attach width.attach}>
    <HeadlessGridHost {layout} width={width.width} {onLayoutChange} options={{ gridConfig: CROSS }} />
  </div>
</div>
