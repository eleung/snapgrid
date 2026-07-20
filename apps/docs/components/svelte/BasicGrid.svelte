<script lang="ts">
  import { type Layout, createContainerWidth } from "@snapgridjs/svelte";
  import { BASIC, GRID, STAGE_WIDTH } from "./demo-config";
  import HeadlessGrid from "./HeadlessGrid.svelte";

  // A real @snapgridjs/svelte grid: drag a tile, resize from the SE corner, watch the
  // rest compact upward. Headless composition (createGridContainer + createGridItem),
  // mirroring the React basic demo — the layout math + drag engine are the shared,
  // framework-free core.
  let layout = $state<Layout>(BASIC);
  const width = createContainerWidth({ initialWidth: STAGE_WIDTH });
</script>

<div {@attach width.attach}>
  <HeadlessGrid
    {layout}
    width={width.width}
    onLayoutChange={(next) => (layout = next)}
    options={{ gridConfig: GRID, resizeConfig: { handles: ["se"] } }}
    resizable
  />
</div>
