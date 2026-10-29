import type {
  BreakpointCols,
  Breakpoints,
  Compactor,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from "@snapgridjs/core";
import type { DragConfig, ResizeConfig } from "@snapgridjs/dnd";
import type { Accessor, JSX } from "solid-js";
import type { UseGridControllerOptions } from "./hooks/useGridController.js";

/**
 * Renders one tile's content. Receives an accessor for the item's **committed** layout
 * entry — the one you passed in `layout`, not the reflowed preview. Called once per tile
 * (tiles are keyed by `i`); read `item()` inside JSX to stay reactive. A tile's live
 * (reflowed) entry during a drag is available from `useGridItem().item`.
 */
export type GridItemRenderer = (item: Accessor<LayoutItem>) => JSX.Element;

/**
 * Remaining `<div>` attributes forwarded onto the grid surface. Excludes keys the grid
 * owns — including the native HTML5 drag events, whose names (`onDragStart`, `onDrag`,
 * `onDrop`) the grid uses for its own callbacks.
 */
type SurfaceAttributes<Own extends PropertyKey> = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  Own | "children" | "style" | "ref"
>;

/**
 * Props for {@link GridLayout} / the internal grid surface. Item content comes from a
 * render-prop child: `<GridLayout …>{(item) => <div>{item().i}</div>}</GridLayout>`.
 * `class`, `style` and other `<div>` attributes merge onto the surface element.
 */
export interface GridLayoutProps
  extends UseGridControllerOptions,
    SurfaceAttributes<keyof UseGridControllerOptions> {
  /** Merged over the surface's positioning style. */
  style?: JSX.CSSProperties;
  children?: GridItemRenderer;
}

/** Every {@link UseGridControllerOptions} key, for splitting them off the surface props. */
export const CONTROLLER_KEYS = [
  "id",
  "type",
  "width",
  "layout",
  "onLayoutChange",
  "gridConfig",
  "dragConfig",
  "resizeConfig",
  "dropConfig",
  "accept",
  "compactor",
  "isDraggable",
  "isResizable",
  "autoSize",
  "onDragStart",
  "onDrag",
  "onDragStop",
  "onResizeStart",
  "onResize",
  "onResizeStop",
  "onDrop",
] as const satisfies readonly (keyof UseGridControllerOptions)[];

// Compile-time guard: adding an option to UseGridControllerOptions without listing it
// above would leak it onto the DOM instead of reaching the controller.
type AssertNever<T extends never> = T;
export type _ControllerKeysExhaustive = AssertNever<
  Exclude<keyof UseGridControllerOptions, (typeof CONTROLLER_KEYS)[number]>
>;

/** The props {@link ResponsiveGridLayout} consumes itself (the rest go to the surface). */
export interface ResponsiveOwnProps {
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

/**
 * Props for {@link ResponsiveGridLayout}. Like React's, it deliberately exposes no grid
 * `id` / `type`: each instance mints a stable id of its own, so two responsive grids in
 * one group can't collide on the same registry key.
 */
export interface ResponsiveGridLayoutProps
  extends ResponsiveOwnProps,
    SurfaceAttributes<keyof UseGridControllerOptions> {
  /** Merged over the surface's positioning style. */
  style?: JSX.CSSProperties;
  children?: GridItemRenderer;
}

export const RESPONSIVE_KEYS = [
  "width",
  "layouts",
  "onLayoutChange",
  "onBreakpointChange",
  "breakpoints",
  "cols",
  "rowHeight",
  "margin",
  "containerPadding",
  "compactor",
  "dragConfig",
  "resizeConfig",
  "isDraggable",
  "isResizable",
  "autoSize",
] as const satisfies readonly (keyof ResponsiveOwnProps)[];

export type _ResponsiveKeysExhaustive = AssertNever<
  Exclude<keyof ResponsiveOwnProps, (typeof RESPONSIVE_KEYS)[number]>
>;
