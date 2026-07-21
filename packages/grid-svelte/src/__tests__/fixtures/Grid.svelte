<script lang="ts">
  import type { GridConfig, Layout } from "@snapgridjs/core";
  import { GridLayout } from "../../index.js";

  interface Props {
    layout: Layout;
    width?: number;
    gridConfig?: Partial<GridConfig>;
    isResizable?: boolean;
    isDraggable?: boolean;
  }

  let {
    layout,
    width = 400,
    gridConfig = { cols: 4, rowHeight: 100, margin: [10, 10], containerPadding: [0, 0] },
    isResizable = true,
    isDraggable = true,
  }: Props = $props();
</script>

<GridLayout {layout} {width} {gridConfig} {isResizable} {isDraggable}>
  {#snippet item(it)}
    <div class="content">{it.i}</div>
  {/snippet}
</GridLayout>
