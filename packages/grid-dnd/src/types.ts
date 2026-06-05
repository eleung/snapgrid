import type { Layout, LayoutItem, ResizeHandleAxis } from "@snapgridjs/core";

/**
 * Drag behaviour configuration (mirrors react-grid-layout v2's `dragConfig`).
 * The interaction itself is driven by dnd-kit.
 */
export interface DragConfig {
  /** Whether items can be dragged. @default true */
  enabled?: boolean;
  /** Keep the dragged item within the grid container bounds. @default false */
  bounded?: boolean;
  /** CSS selector for a drag handle inside each item. */
  handle?: string;
  /** CSS selector for regions that should cancel a drag. */
  cancel?: string;
  /** Pixels the pointer must move before a drag starts. @default 3 */
  threshold?: number;
  /**
   * snapgrid extra: snap the dragged tile itself to grid cells while dragging.
   * When `false` (the default, matching react-grid-layout) the tile follows the
   * pointer smoothly and only the placeholder snaps.
   */
  snapToGrid?: boolean;
}

/**
 * Resize behaviour configuration (mirrors react-grid-layout v2's `resizeConfig`).
 */
export interface ResizeConfig {
  /** Whether items can be resized. @default true */
  enabled?: boolean;
  /** Which handles to show on each item (item-level `resizeHandles` overrides). @default ['se'] */
  handles?: ResizeHandleAxis[];
}

/** Minimal source shape passed to a {@link DropConfig.accept} predicate. */
export interface DragSourceInfo {
  id: string | number;
  type?: unknown;
  data?: unknown;
}

/**
 * Accept arbitrary (non-grid) dnd-kit draggables dropped into the grid. The
 * external draggable should carry `data.snapGridDrop = { i?, w?, h? }` to control
 * the inserted item's id/size; otherwise `defaultItem` is used. On drop the grid
 * fires `onDrop(layout, item, event)` rather than `onLayoutChange`.
 *
 * Requires the grid and the external draggable to share one provider
 * (e.g. both inside a `<SnapGridGroup>`).
 */
export interface DropConfig {
  /** Accept external draggables. @default false */
  enabled?: boolean;
  /** Default size for a dropped item when the source omits `snapGridDrop`. @default { w: 1, h: 1 } */
  defaultItem?: { w: number; h: number };
  /** Restrict which external sources are accepted. @default accept any non-grid draggable */
  accept?: (source: DragSourceInfo) => boolean;
}

/** The `data.snapGridDrop` payload an external draggable carries to drop into a grid. */
export interface GridDropData {
  /** Id for the inserted item (a unique one is generated if omitted). */
  i?: string;
  /** Width in grid units. */
  w?: number;
  /** Height in grid units. */
  h?: number;
}

/**
 * react-grid-layout-compatible lifecycle callback.
 * `(layout, oldItem, newItem, placeholder, event, node)`
 */
export type GridEventCallback = (
  layout: Layout,
  oldItem: LayoutItem | null,
  newItem: LayoutItem | null,
  placeholder: LayoutItem | null,
  event: Event | null,
  node: HTMLElement | null,
) => void;
