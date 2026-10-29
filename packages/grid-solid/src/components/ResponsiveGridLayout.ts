import type { GridConfig } from "@snapgridjs/core";
import { type JSX, createComponent, createMemo, mergeProps, splitProps } from "solid-js";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout.js";
import { RESPONSIVE_KEYS, type ResponsiveGridLayoutProps } from "../props.js";
import { GridLayout } from "./GridLayout.js";

/**
 * A responsive grid: switches column count and layout by breakpoint as `width` changes,
 * generating a breakpoint's layout from the nearest one when absent. A thin wrapper over
 * {@link useResponsiveLayout} + {@link GridLayout}; mirrors RGL v2's ResponsiveGridLayout.
 */
export function ResponsiveGridLayout(props: ResponsiveGridLayoutProps): JSX.Element {
  // `id` / `type` are split off and dropped: `GridLayout` reads them as the grid's
  // droppable/registry key, so a stray `id` attribute forwarded through would silently
  // make two `<ResponsiveGridLayout id="grid">` in one `<SnapGridGroup>` register under
  // the same key. Like React's, this component doesn't expose the grid id.
  const [local, , passthrough] = splitProps(
    props as ResponsiveGridLayoutProps & { id?: string; type?: string },
    RESPONSIVE_KEYS,
    ["id", "type"],
  );

  const responsive = useResponsiveLayout(() => ({
    width: local.width,
    layouts: local.layouts,
    breakpoints: local.breakpoints,
    cols: local.cols,
    compactor: local.compactor,
    onLayoutChange: local.onLayoutChange,
    onBreakpointChange: local.onBreakpointChange,
  }));

  const gridConfig = createMemo<Partial<GridConfig>>(() => ({
    cols: responsive.cols(),
    rowHeight: local.rowHeight ?? 150,
    margin: local.margin ?? [10, 10],
    containerPadding: local.containerPadding ?? null,
  }));

  // No explicit `id`: useGridContainer mints a stable per-instance id, which avoids
  // droppable/registry identity churn when the breakpoint changes and keeps two
  // responsive grids in a group from colliding on the same id.
  return createComponent(
    GridLayout,
    mergeProps(passthrough, {
      get layout() {
        return responsive.layout();
      },
      get width() {
        return local.width;
      },
      onLayoutChange: responsive.onLayoutChange,
      get gridConfig() {
        return gridConfig();
      },
      get compactor() {
        return local.compactor;
      },
      get dragConfig() {
        return local.dragConfig;
      },
      get resizeConfig() {
        return local.resizeConfig;
      },
      get isDraggable() {
        return local.isDraggable;
      },
      get isResizable() {
        return local.isResizable;
      },
      get autoSize() {
        return local.autoSize;
      },
    }),
  );
}
