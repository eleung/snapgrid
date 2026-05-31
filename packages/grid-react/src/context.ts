import type { Sensors } from "@dnd-kit/dom";
import type {
  DragSession,
  GridConfig,
  Layout,
  LayoutItem,
  PositionParams,
  ResizeHandleAxis,
} from "@snapgrid/core";
import { createContext, useContext } from "react";

/** Data attached to the dnd-kit draggables snapgrid creates. */
export type SnapGridDragData =
  // `item` carries the full layout entry so a *different* grid can render/insert
  // it when the tile is dragged across grids.
  | { kind: "move"; itemId: string; item: LayoutItem }
  | { kind: "resize"; itemId: string; handle: ResizeHandleAxis };

/**
 * Live grid state shared by {@link SnapGridProvider} with the headless hooks.
 * Holds no DOM and imposes no styling — just the data hooks need to produce
 * refs, positioning styles, and state flags.
 */
export interface GridRuntime {
  /** Stable id of the grid's droppable surface. */
  containerId: string;
  /** Measured container width in pixels. */
  width: number;
  /** Grow the container height to fit content. */
  autoSize: boolean;
  /** Resolved grid configuration. */
  gridConfig: GridConfig;
  /** Geometry params derived from gridConfig + width. */
  positionParams: PositionParams;
  /** The layout currently being rendered (drag preview if dragging, else the controlled layout). */
  renderedLayout: Layout;
  /** Fast lookup into {@link renderedLayout} by item id. */
  itemsById: ReadonlyMap<string, LayoutItem>;
  /** The in-progress drag session, or null. */
  session: DragSession | null;
  /** Whether the item with this id may be dragged. */
  isItemDraggable: (id: string) => boolean;
  /** Whether the item with this id may be resized. */
  isItemResizable: (id: string) => boolean;
  /** The resize handles to show for the item with this id. */
  resizeHandlesFor: (id: string) => readonly ResizeHandleAxis[];
  /** Sensors for item (move) draggables (threshold + handle/cancel gating). */
  itemSensors: Sensors;
  /** Called by {@link useGridContainer} to report the surface element (for cross-grid geometry). */
  setContainerElement: (element: Element | null) => void;
  /** The floating drag preview for this grid's active drag (source grid only), or null. */
  overlay: GridOverlayInfo | null;
}

/** Where/what to render as the floating drag preview (a body portal). */
export interface GridOverlayInfo {
  item: LayoutItem;
  /** Fixed (viewport) coordinates and size of the preview. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export const GridContext = createContext<GridRuntime | null>(null);

/** Read the grid runtime; throws if used outside a `SnapGridProvider`. */
export function useGridRuntime(): GridRuntime {
  const runtime = useContext(GridContext);
  if (!runtime) {
    throw new Error(
      "snapgrid: hooks and components must be rendered inside a <SnapGridProvider> (or <GridLayout>).",
    );
  }
  return runtime;
}
