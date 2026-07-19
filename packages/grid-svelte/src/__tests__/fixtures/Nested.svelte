<script lang="ts">
  import type { Layout } from "@snapgridjs/core";
  import { GridLayout } from "../../index.js";

  interface Props {
    outer: Layout;
    inner: Layout;
  }

  let { outer, inner }: Props = $props();

  const gridConfig = { cols: 4, rowHeight: 100, margin: [10, 10] as [number, number], containerPadding: [0, 0] as [number, number] };
</script>

<!-- A nested grid hosted inside an outer tile: the inner grid must NOT mint a second
     dnd-kit manager (it shares the outer provider). If dedupe were broken, the inner
     tiles would throw "no grid found". -->
<GridLayout id="outer" layout={outer} width={400} {gridConfig}>
  {#snippet item(it)}
    {#if it.i === "host"}
      <GridLayout id="inner" layout={inner} width={180} {gridConfig}>
        {#snippet item(inner)}
          <div class="inner-content">{inner.i}</div>
        {/snippet}
      </GridLayout>
    {:else}
      <div class="outer-content">{it.i}</div>
    {/if}
  {/snippet}
</GridLayout>
