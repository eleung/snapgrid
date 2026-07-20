<script lang="ts">
  import { type Layout, SnapGridGroup } from "@snapgridjs/svelte";
  import CrossSubGrid from "./CrossSubGrid.svelte";
  import { LEFT, RIGHT } from "./demo-config";

  // Two grids under one <SnapGridGroup> (which supplies the shared DragDropProvider):
  // drag tiles between them. The dragged tile floats itself across both grids.
  let left = $state<Layout>(LEFT);
  let right = $state<Layout>(RIGHT);
</script>

<SnapGridGroup>
  <div class="dg-gridrow">
    <CrossSubGrid label="Grid A" layout={left} onLayoutChange={(next) => (left = next)} />
    <CrossSubGrid label="Grid B" layout={right} onLayoutChange={(next) => (right = next)} />
  </div>
</SnapGridGroup>
