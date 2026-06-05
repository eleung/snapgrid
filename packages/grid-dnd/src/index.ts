/**
 * @snapgridjs/dnd
 *
 * The framework-agnostic dnd-kit grid engine — snapgrid's drag/resize/cross-grid
 * brain, with no React (or any framework) dependency. `@snapgridjs/react` is a
 * thin binding over this; a Vue/Solid/Svelte binding would be too.
 *
 * This barrel is the binding-author API. The drag-decision internals
 * (`classifyDrop`, `receiveCell`, `externalDropSpec`, …) the engine uses are
 * intentionally NOT exported — they're implementation detail, not a public,
 * semver-locked surface.
 */

// Drag/drop config + event types (the public option/callback shapes).
export type {
  DragConfig,
  DragSourceInfo,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "./types.js";

// The drag payload a binding's tiles carry (so a binding can type its `data`).
export type { SnapGridDragData } from "./dnd/dragData.js";

// Per-grid observable render bridge + the config/snapshot types a binding implements.
export { GridController } from "./controller/GridController.js";
export type {
  GridCallbacks,
  GridControllerConfig,
  ItemSnapshot,
  ResizeSnapshot,
} from "./controller/GridController.js";
export { getController, registerController } from "./controller/registry.js";

// The engine: attach it to a dnd-kit manager (ref-counted; one per manager).
export { attachEngine } from "./dnd/SnapGridEngine.js";

// dnd-kit interaction pieces a binding wires onto its droppables/draggables.
export { SNAPGRID_GRID_ATTR, gridCollisionDetector } from "./dnd/collision.js";
export { SnapToGrid } from "./dnd/snapToGrid.js";
export { domElement } from "./dnd/entity.js";
export { NO_FEEDBACK, RESIZE_HANDLE_ATTR, buildItemSensors } from "./dndShared.js";
