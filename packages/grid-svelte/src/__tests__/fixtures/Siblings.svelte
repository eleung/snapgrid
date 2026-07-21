<script lang="ts">
  import type { Layout } from "@snapgridjs/core";
  import { GridLayout, SnapGridGroup } from "../../index.js";

  interface Props {
    left: Layout;
    right: Layout;
  }

  let { left, right }: Props = $props();

  const gridConfig = { cols: 4, rowHeight: 100, margin: [10, 10] as [number, number], containerPadding: [0, 0] as [number, number] };
</script>

<!-- Two sibling grids sharing one provider so tiles can cross between them. -->
<SnapGridGroup>
  <GridLayout id="left" layout={left} width={400} {gridConfig}>
    {#snippet item(it)}
      <div class="left-content">{it.i}</div>
    {/snippet}
  </GridLayout>
  <GridLayout id="right" layout={right} width={400} {gridConfig}>
    {#snippet item(it)}
      <div class="right-content">{it.i}</div>
    {/snippet}
  </GridLayout>
</SnapGridGroup>
