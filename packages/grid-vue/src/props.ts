import type {
  BreakpointCols,
  Breakpoints,
  Compactor,
  GridConfig,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from "@snapgridjs/core";
import type { DragConfig, DragSourceInfo, DropConfig, GridEventCallback } from "@snapgridjs/dnd";
import type { PropType } from "vue";
import type { UseGridControllerOptions } from "./hooks/useGridController.js";

/**
 * Props for {@link GridLayout} / the internal grid surface.
 *
 * Item content is supplied through the `item` scoped slot (Vue has no keyed-children
 * analog to React's `Children.map`): `<template #item="{ item }">`. The slot receives the
 * **committed** layout entry — the one you passed in `layout`, not the reflowed preview.
 * A tile's live (reflowed) entry during a drag is available from `useGridItem().item`.
 * `class` and `style` are ordinary fallthrough attributes and merge onto the surface.
 */
export interface GridLayoutProps extends UseGridControllerOptions {}

/** Props for {@link ResponsiveGridLayout}. */
export interface ResponsiveGridLayoutProps {
  /** Container width in pixels (e.g. from {@link useContainerWidth}). */
  width: number;
  /** Controlled per-breakpoint layouts. Items are keyed by `i`. */
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
}

// Re-exported for the interface above without pulling the value import in.
type ResizeConfig = import("@snapgridjs/dnd").ResizeConfig;

// Optional booleans MUST carry an explicit `default: undefined`. Vue casts an absent
// Boolean prop to `false` unless a default is declared, which would turn "not
// specified" into "explicitly disabled" and defeat the `?? true` defaults downstream.
const optionalBoolean = { type: Boolean, default: undefined } as const;

/** Runtime prop declarations shared by `GridLayout` and the internal surface. */
export const gridControllerProps = {
  id: String,
  type: String,
  width: { type: Number, required: true as const },
  layout: { type: Array as PropType<Layout>, required: true as const },
  onLayoutChange: Function as PropType<(layout: Layout) => void>,
  gridConfig: Object as PropType<Partial<GridConfig>>,
  dragConfig: Object as PropType<DragConfig>,
  resizeConfig: Object as PropType<ResizeConfig>,
  dropConfig: Object as PropType<DropConfig>,
  accept: Function as PropType<(source: DragSourceInfo) => boolean>,
  compactor: Object as PropType<Compactor>,
  isDraggable: optionalBoolean,
  isResizable: optionalBoolean,
  autoSize: optionalBoolean,
  onDragStart: Function as PropType<GridEventCallback>,
  onDrag: Function as PropType<GridEventCallback>,
  onDragStop: Function as PropType<GridEventCallback>,
  onResizeStart: Function as PropType<GridEventCallback>,
  onResize: Function as PropType<GridEventCallback>,
  onResizeStop: Function as PropType<GridEventCallback>,
  onDrop: Function as PropType<(layout: Layout, item: LayoutItem, event: Event | null) => void>,
};

/** Runtime prop declarations for `ResponsiveGridLayout`. */
export const responsiveGridProps = {
  width: { type: Number, required: true as const },
  layouts: { type: Object as PropType<ResponsiveLayouts>, required: true as const },
  onLayoutChange: Function as PropType<(layout: Layout, layouts: ResponsiveLayouts) => void>,
  onBreakpointChange: Function as PropType<(breakpoint: string, cols: number) => void>,
  breakpoints: Object as PropType<Breakpoints>,
  cols: Object as PropType<BreakpointCols>,
  rowHeight: Number,
  margin: Array as unknown as PropType<[number, number]>,
  containerPadding: Array as unknown as PropType<[number, number] | null>,
  compactor: Object as PropType<Compactor>,
  dragConfig: Object as PropType<DragConfig>,
  resizeConfig: Object as PropType<ResizeConfig>,
  isDraggable: optionalBoolean,
  isResizable: optionalBoolean,
  autoSize: optionalBoolean,
};
