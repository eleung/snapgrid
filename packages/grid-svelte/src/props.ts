import type {
  BreakpointCols,
  Breakpoints,
  Compactor,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from "@snapgridjs/core";
import type { DragConfig, ResizeConfig } from "@snapgridjs/dnd";
import type { Snippet } from "svelte";
import type { UseGridControllerOptions } from "./hooks/createGridController.svelte.js";

/** Props for {@link GridLayout} / the internal grid surface. */
export interface GridLayoutProps extends UseGridControllerOptions {
  /**
   * Renders each layout item's content. Receives the item's current (reflowed)
   * layout entry. Svelte has no keyed-children analog to React's `Children.map`,
   * so items are supplied via this snippet keyed by `i`.
   */
  item: Snippet<[LayoutItem]>;
  /** Appended to the default `snapgrid` class on the surface. */
  class?: string;
  /** Merged after (and able to override) the surface's positioning style. */
  style?: string;
}

/** Props for {@link ResponsiveGridLayout}. */
export interface ResponsiveGridLayoutProps {
  /** Container width in pixels (e.g. from {@link createContainerWidth}). */
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
  class?: string;
  style?: string;
  /** Renders each layout item's content (keyed by `i`). */
  item: Snippet<[LayoutItem]>;
}
