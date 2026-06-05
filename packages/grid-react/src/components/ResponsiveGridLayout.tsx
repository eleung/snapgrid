import type {
  BreakpointCols,
  Breakpoints,
  Compactor,
  Layout,
  ResponsiveLayouts,
} from "@snapgridjs/core";
import type { DragConfig, ResizeConfig } from "@snapgridjs/dnd";
import { type CSSProperties, type ReactNode, useMemo } from "react";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout.js";
import { GridLayout } from "./GridLayout.js";

export interface ResponsiveGridLayoutProps {
  /** Container width in pixels (e.g. from {@link useContainerWidth}). */
  width: number;
  /** Controlled per-breakpoint layouts. Children are keyed by item `i`. */
  layouts: ResponsiveLayouts;
  /** Called when a layout commits: the active layout and the updated map. */
  onLayoutChange?: (layout: Layout, layouts: ResponsiveLayouts) => void;
  /** Called when the active breakpoint changes. */
  onBreakpointChange?: (breakpoint: string, cols: number) => void;
  /** Breakpoint → min width (px). @default lg/md/sm/xs/xxs */
  breakpoints?: Breakpoints;
  /** Breakpoint → column count. @default 12/10/6/4/2 */
  cols?: BreakpointCols;
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number] | null;
  compactor?: Compactor;
  dragConfig?: DragConfig;
  resizeConfig?: ResizeConfig;
  isDraggable?: boolean;
  isResizable?: boolean;
  autoSize?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * A responsive grid: switches column count and layout by breakpoint as `width`
 * changes, generating a breakpoint's layout from the nearest one when absent.
 * A thin wrapper over {@link useResponsiveLayout} + {@link GridLayout}; mirrors
 * react-grid-layout v2's `ResponsiveGridLayout`.
 */
export function ResponsiveGridLayout(props: ResponsiveGridLayoutProps): React.JSX.Element {
  const { cols, layout, onLayoutChange } = useResponsiveLayout({
    width: props.width,
    layouts: props.layouts,
    breakpoints: props.breakpoints,
    cols: props.cols,
    compactor: props.compactor,
    onLayoutChange: props.onLayoutChange,
    onBreakpointChange: props.onBreakpointChange,
  });

  // Stable object identity so the grid host's gridConfig/positionParams memos
  // aren't busted on every render (e.g. each width tick).
  const gridConfig = useMemo(
    () => ({
      cols,
      rowHeight: props.rowHeight ?? 150,
      margin: props.margin ?? ([10, 10] as [number, number]),
      containerPadding: props.containerPadding ?? null,
    }),
    [cols, props.rowHeight, props.margin, props.containerPadding],
  );

  return (
    // No explicit `id`: useGridContainer mints a stable per-instance id (useId),
    // which avoids droppable/registry identity churn when the breakpoint changes and
    // keeps two responsive grids in a group from colliding on the same id.
    <GridLayout
      layout={layout}
      width={props.width}
      onLayoutChange={onLayoutChange}
      gridConfig={gridConfig}
      compactor={props.compactor}
      dragConfig={props.dragConfig}
      resizeConfig={props.resizeConfig}
      isDraggable={props.isDraggable}
      isResizable={props.isResizable}
      autoSize={props.autoSize}
      className={props.className}
      style={props.style}
    >
      {props.children}
    </GridLayout>
  );
}
