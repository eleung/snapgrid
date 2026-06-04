import type { LayoutItem, ResizeHandleAxis } from "@snapgridjs/core";

/** Data attached to the dnd-kit draggables snapgrid creates. */
export type SnapGridDragData =
  // `item` carries the full layout entry so a *different* grid can render/insert
  // it when the tile is dragged across grids.
  | { kind: "move"; itemId: string; item: LayoutItem }
  | { kind: "resize"; itemId: string; handle: ResizeHandleAxis };
