/**
 * @snapgridjs/core
 *
 * Framework-agnostic layout engine for snapgrid. This is a thin adapter over
 * `react-grid-layout/core` (re-exported via {@link ./rgl}) plus a small number
 * of original helpers that bridge RGL's API to the dnd-kit interaction layer.
 */

// Re-export the react-grid-layout/core surface we depend on.
export * from "./rgl.js";

// Original additions.
export { toPositionParams } from "./geometry.js";
export {
  insertItemWithCompactor,
  moveItemWithCompactor,
  type MoveItemOptions,
  removeItemWithCompactor,
  resizeItemWithCompactor,
  type ResizeItemOptions,
} from "./move.js";
export {
  beginDrag,
  beginReceive,
  beginResize,
  commitLayout,
  type DragAnchor,
  type DragContext,
  type DragKind,
  type DragSession,
  dragResize,
  dragTo,
  hideActive,
  nudge,
  type ResizeAnchor,
  stripMoved,
} from "./session.js";
