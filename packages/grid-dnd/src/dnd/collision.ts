import { type CollisionDetector, pointerIntersection } from "@dnd-kit/collision";
import { domElement } from "./entity.js";

/**
 * Marker attribute set on every grid container element. Used by {@link nestedDepth}
 * to measure how deeply a surface is nested, purely from the DOM.
 */
export const SNAPGRID_GRID_ATTR = "data-snapgrid-grid";

/**
 * Marker attribute a consumer sets on a **non-grid** drop zone nested inside a grid
 * (a trash slot, a sub-list, a "drop here" panel) so {@link nestedDepth} counts it
 * as a nesting boundary. Pair it with {@link nestedDropCollisionDetector} on the same
 * `useDroppable` and the zone outranks the grid it sits inside — and any drop zone
 * nested deeper outranks it in turn (innermost wins).
 */
export const SNAPGRID_DROPPABLE_ATTR = "data-snapgrid-droppable";

// Base priority for a grid (or nested drop-zone) droppable. Outranks a dragged
// tile's own sortable droppable so collision inside a grid resolves to the container
// (RGL drives the move, not dnd-kit's sortable reorder), and lets a foreign sortable
// resolve the grid as its drop target. The nesting depth below adds to this so an
// inner surface outranks an outer one when their rects overlap.
const GRID_COLLISION_PRIORITY = 10;

/**
 * How deeply `el` is nested among snapgrid droppable surfaces: the count of ANCESTORS
 * carrying a grid ({@link SNAPGRID_GRID_ATTR}) or drop-zone ({@link SNAPGRID_DROPPABLE_ATTR})
 * marker. The walk starts at `el.parentElement`, so `el`'s own marker never counts for
 * itself — a marker earns depth for its descendants. A top-level grid is 0, a surface one
 * grid deep is 1, and so on; the deeper surface wins. DOM containment is the ground truth,
 * independent of the React tree shape.
 */
export function nestedDepth(el: Element | null | undefined): number {
  let depth = 0;
  let node = el?.parentElement ?? null;
  while (node) {
    if (node.hasAttribute(SNAPGRID_GRID_ATTR) || node.hasAttribute(SNAPGRID_DROPPABLE_ATTR))
      depth++;
    node = node.parentElement;
  }
  return depth;
}

/**
 * Collision detector for grid containers and consumer-owned nested drop zones alike.
 * Uses **pointer** intersection (not dnd-kit's default, which is pointer-first but
 * falls back to the dragged SHAPE when the pointer leaves a droppable): a surface
 * claims a drag only while the pointer is genuinely inside it. The shape fallback was
 * actively wrong here — the priority boost (below) made a large dragged tile keep
 * winning a grid via mere rect-overlap even after the pointer moved off onto a sibling
 * droppable (e.g. a sortable card beside the grid), so the tile could never leave the
 * grid for that target. Pointer-only also aligns collision with the receive math,
 * which maps the pointer (not the tile rect) to a cell.
 *
 * When the pointer IS inside, rank the surface above the dragged tile's own sortable
 * droppable (so an in-grid move resolves to the container, letting RGL drive it — not
 * dnd-kit's sortable reorder) and above a sibling the pointer also happens to be over,
 * then break ties between overlapping nested surfaces by boosting priority with the
 * nesting depth so the **innermost** wins; at depth 0 (a lone top-level grid) priority
 * is just the base.
 */
export const gridCollisionDetector: CollisionDetector = (input) => {
  const collision = pointerIntersection(input);
  if (!collision) return null;
  return {
    ...collision,
    priority: GRID_COLLISION_PRIORITY + nestedDepth(domElement(input.droppable)),
  };
};

/**
 * Collision detector for a consumer's **non-grid** drop zone nested in a grid —
 * intentionally the SAME detector as {@link gridCollisionDetector}, exported under a name
 * that reads right on a `useDroppable`. A zone using it already outranks its grid (the
 * grid is a marked ancestor, so it ranks one deeper) — the zone needs no marker of its
 * own to win. Mark it with {@link SNAPGRID_DROPPABLE_ATTR} only to rank droppables nested
 * INSIDE it; without the marker, two zones at the same grid depth tie. When the zone wins,
 * the grid backs off (its engine reverts a target it doesn't own).
 */
export const nestedDropCollisionDetector = gridCollisionDetector;
