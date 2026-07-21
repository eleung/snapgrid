<script lang="ts">
  import type { ResponsiveLayouts } from "@snapgridjs/core";
  import { ResponsiveGridLayout } from "../../index.js";

  interface Props {
    width: number;
    layouts: ResponsiveLayouts;
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
  }

  let { width, layouts, onBreakpointChange }: Props = $props();
</script>

<ResponsiveGridLayout {width} {layouts} {onBreakpointChange} rowHeight={100} margin={[10, 10]}>
  {#snippet item(it)}
    <div class="content">{it.i}</div>
  {/snippet}
</ResponsiveGridLayout>
