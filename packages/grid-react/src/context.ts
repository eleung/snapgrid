import type { Sensors } from "@dnd-kit/dom";
import type { GridConfig, LayoutItem, PositionParams, ResizeHandleAxis } from "@snapgridjs/core";
import { createContext, useContext } from "react";
import type { GridController } from "./controller/GridController.js";

export type { GridOverlayInfo } from "./controller/GridController.js";

/** Data attached to the dnd-kit draggables snapgrid creates. */
export type SnapGridDragData =
  // `item` carries the full layout entry so a *different* grid can render/insert
  // it when the tile is dragged across grids.
  | { kind: "move"; itemId: string; item: LayoutItem }
  | { kind: "resize"; itemId: string; handle: ResizeHandleAxis };

/**
 * Stable, per-grid configuration shared by {@link SnapGridProvider} with the
 * headless hooks. Holds NO live drag/resize state — that lives in
 * {@link GridController} (a useSyncExternalStore observable), so a drag
 * re-renders only the tiles whose slice changed, not the whole subtree. This
 * context value changes only when config (width/gridConfig/...) changes, not on
 * every drag frame.
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
  /** The live drag/resize store (session, overlay, per-item snapshots). */
  controller: GridController;
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
