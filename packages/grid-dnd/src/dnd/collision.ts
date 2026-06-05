import { type CollisionDetector, defaultCollisionDetection } from "@dnd-kit/collision";
import { domElement } from "./entity.js";

/**
 * Marker attribute set on every grid container element. Used by {@link gridDepth}
 * to measure how deeply a grid is nested, purely from the DOM.
 */
export const SNAPGRID_GRID_ATTR = "data-snapgrid-grid";

// Base priority for a grid droppable. Outranks a dragged tile's own sortable
// droppable so collision inside a grid resolves to the container (RGL drives the
// move, not dnd-kit's sortable reorder), and lets a foreign sortable resolve the
// grid as its drop target. `gridDepth` adds to this so an inner grid outranks its
// outer one when their rects overlap.
const GRID_COLLISION_PRIORITY = 10;

/**
 * How deeply `el`'s grid is nested: the number of ancestor grid containers above
 * it. A top-level grid is 0; a grid rendered inside another grid's tile is 1; and
 * so on. DOM containment is the ground truth, so this is correct regardless of the
 * React tree shape or how priorities are assigned elsewhere.
 */
export function gridDepth(el: Element | null | undefined): number {
  let depth = 0;
  let node = el?.parentElement ?? null;
  while (node) {
    if (node.hasAttribute(SNAPGRID_GRID_ATTR)) depth++;
    node = node.parentElement;
  }
  return depth;
}

/**
 * Collision detector for grid droppables. Runs dnd-kit's default detector, then —
 * when nested grid rects overlap (the pointer is over both an inner grid and its
 * outer one) — ranks the **innermost** grid highest by boosting priority with the
 * grid's nesting depth. Without this, overlapping grids tie on priority and the
 * winner is arbitrary. For non-nested grids depth is 0, so priority is unchanged.
 */
export const gridCollisionDetector: CollisionDetector = (input) => {
  const collision = defaultCollisionDetection(input);
  if (!collision) return null;
  return {
    ...collision,
    priority: GRID_COLLISION_PRIORITY + gridDepth(domElement(input.droppable)),
  };
};
