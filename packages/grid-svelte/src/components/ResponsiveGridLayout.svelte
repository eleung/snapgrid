<script lang="ts">
  import type { GridConfig } from "@snapgridjs/core";
  import type { ResponsiveGridLayoutProps } from "../props.js";
  import { createResponsiveLayout } from "../hooks/createResponsiveLayout.svelte.js";
  import GridLayout from "./GridLayout.svelte";

  // A responsive grid: switches column count and layout by breakpoint as `width`
  // changes, generating a breakpoint's layout from the nearest one when absent. A thin
  // wrapper over createResponsiveLayout + <GridLayout>; mirrors RGL v2's
  // ResponsiveGridLayout.
  let props: ResponsiveGridLayoutProps = $props();

  const responsive = createResponsiveLayout(() => ({
    width: props.width,
    layouts: props.layouts,
    breakpoints: props.breakpoints,
    cols: props.cols,
    compactor: props.compactor,
    onLayoutChange: props.onLayoutChange,
    onBreakpointChange: props.onBreakpointChange,
  }));

  const gridConfig = $derived<Partial<GridConfig>>({
    cols: responsive.cols,
    rowHeight: props.rowHeight ?? 150,
    margin: props.margin ?? ([10, 10] as [number, number]),
    containerPadding: props.containerPadding ?? null,
  });
</script>

<!--
  No explicit `id`: createGridContainer mints a stable per-instance id, which avoids
  droppable/registry identity churn when the breakpoint changes and keeps two
  responsive grids in a group from colliding on the same id.
-->
<GridLayout
  layout={responsive.layout}
  width={props.width}
  onLayoutChange={responsive.onLayoutChange}
  {gridConfig}
  compactor={props.compactor}
  dragConfig={props.dragConfig}
  resizeConfig={props.resizeConfig}
  isDraggable={props.isDraggable}
  isResizable={props.isResizable}
  autoSize={props.autoSize}
  class={props.class}
  style={props.style}
  item={props.item}
/>
