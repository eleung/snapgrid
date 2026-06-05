import type { LayoutItem, ResizeHandleAxis } from "@snapgridjs/core";

/**
 * Data attached to the dnd-kit draggables snapgrid creates. `group` is the owning
 * grid's id, so the centralized {@link SnapGridEngine} can resolve the source
 * grid's controller from the drag payload (one engine drives every grid).
 */
export type SnapGridDragData =
  // `item` carries the full layout entry so a *different* grid can render/insert
  // it when the tile is dragged across grids.
  | { kind: "move"; itemId: string; item: LayoutItem; group: string }
  | { kind: "resize"; itemId: string; handle: ResizeHandleAxis; group: string };
