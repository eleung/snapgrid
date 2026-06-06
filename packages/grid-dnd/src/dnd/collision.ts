import { type CollisionDetector, pointerIntersection } from "@dnd-kit/collision";
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
 * Collision detector for grid droppables. Uses **pointer** intersection (not
 * dnd-kit's default, which is pointer-first but falls back to the dragged SHAPE
 * when the pointer leaves a droppable): a grid claims a drag only while the
 * pointer is genuinely inside it. The shape fallback was actively wrong here —
 * the grid's priority boost (below) made a large dragged tile keep winning the
 * grid via mere rect-overlap even after the pointer moved off onto a sibling
 * droppable (e.g. a sortable card beside the grid), so the tile could never
 * leave the grid for that target. Pointer-only also aligns collision with the
 * receive math, which maps the pointer (not the tile rect) to a cell.
 *
 * When the pointer IS inside, rank the grid above the dragged tile's own
 * sortable droppable (so an in-grid move resolves to the container, letting RGL
 * drive it — not dnd-kit's sortable reorder) and above a sibling droppable the
 * pointer also happens to be over. For nested grids whose rects overlap (the
 * pointer is over both an inner grid and its outer one), boost priority by the
 * grid's nesting depth so the **innermost** grid wins; for non-nested grids
 * depth is 0, so priority is unchanged.
 */
export const gridCollisionDetector: CollisionDetector = (input) => {
  const collision = pointerIntersection(input);
  if (!collision) return null;
  return {
    ...collision,
    priority: GRID_COLLISION_PRIORITY + gridDepth(domElement(input.droppable)),
  };
};
