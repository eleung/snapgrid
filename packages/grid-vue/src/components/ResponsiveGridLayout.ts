import type { GridConfig } from "@snapgridjs/core";
import { computed, defineComponent, h } from "vue";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout.js";
import { responsiveGridProps } from "../props.js";
import { GridLayout } from "./GridLayout.js";

/**
 * A responsive grid: switches column count and layout by breakpoint as `width` changes,
 * generating a breakpoint's layout from the nearest one when absent. A thin wrapper over
 * {@link useResponsiveLayout} + {@link GridLayout}; mirrors RGL v2's
 * ResponsiveGridLayout.
 */
export const ResponsiveGridLayout = defineComponent({
  name: "SnapResponsiveGridLayout",
  inheritAttrs: false,
  props: responsiveGridProps,
  setup(props, { slots, attrs }) {
    const responsive = useResponsiveLayout(() => ({
      width: props.width,
      layouts: props.layouts,
      breakpoints: props.breakpoints,
      cols: props.cols,
      compactor: props.compactor,
      onLayoutChange: props.onLayoutChange,
      onBreakpointChange: props.onBreakpointChange,
    }));

    const gridConfig = computed<Partial<GridConfig>>(() => ({
      cols: responsive.cols.value,
      rowHeight: props.rowHeight ?? 150,
      margin: props.margin ?? [10, 10],
      containerPadding: props.containerPadding ?? null,
    }));

    return () => {
      // `GridLayout` declares `id` and `type` as PROPS, so a fallthrough attribute of
      // either name would be consumed as the grid's droppable/registry key instead of
      // landing on the DOM — silently making two `<ResponsiveGridLayout id="grid">` in
      // one `<SnapGridGroup>` register under the same key. Drop them here; like React's
      // ResponsiveGridLayout, this component deliberately doesn't expose the grid id.
      const { id: _id, type: _type, ...passthrough } = attrs;
      return h(
        GridLayout,
        {
          ...passthrough,
          // No explicit `id`: useGridContainer mints a stable per-instance id, which
          // avoids droppable/registry identity churn when the breakpoint changes and
          // keeps two responsive grids in a group from colliding on the same id.
          layout: responsive.layout.value,
          width: props.width,
          onLayoutChange: responsive.onLayoutChange,
          gridConfig: gridConfig.value,
          compactor: props.compactor,
          dragConfig: props.dragConfig,
          resizeConfig: props.resizeConfig,
          isDraggable: props.isDraggable,
          isResizable: props.isResizable,
          autoSize: props.autoSize,
        },
        slots,
      );
    };
  },
});
