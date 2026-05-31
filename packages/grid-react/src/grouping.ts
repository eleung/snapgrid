import { createContext } from "react";

/**
 * Tracks the grids that share a {@link SnapGridGroup} so any grid can resolve
 * which grid a pointer is over. We use geometry (not dnd-kit's collision
 * target) because snapgrid drags with `feedback: 'none'`, under which dnd-kit
 * does not track a moving shape and never resolves a droppable target.
 */
export interface GridRegistry {
  /** Register a grid's id and a getter for its current client rect. Returns an unregister fn. */
  register(id: string, getRect: () => DOMRect | null): () => void;
  /** Id of the registered grid whose rect contains `point`, or null. */
  gridAt(point: { x: number; y: number }): string | null;
  /**
   * Record the pixel offset of the pointer within the dragged tile at drag
   * start (or `null` to clear). Shared so a *receiving* grid can place the tile
   * under the same point the user grabbed, not with its top-left at the cursor.
   */
  setGrabOffset(offset: { x: number; y: number } | null): void;
  /** The active drag's grab offset, or `{ x: 0, y: 0 }` when none is recorded. */
  getGrabOffset(): { x: number; y: number };
}

export function createGridRegistry(): GridRegistry {
  const grids = new Map<string, () => DOMRect | null>();
  let grabOffset: { x: number; y: number } | null = null;
  return {
    register(id, getRect) {
      grids.set(id, getRect);
      return () => {
        if (grids.get(id) === getRect) grids.delete(id);
      };
    },
    gridAt(point) {
      for (const [id, getRect] of grids) {
        const r = getRect();
        if (
          r &&
          point.x >= r.left &&
          point.x <= r.right &&
          point.y >= r.top &&
          point.y <= r.bottom
        ) {
          return id;
        }
      }
      return null;
    },
    setGrabOffset(offset) {
      grabOffset = offset;
    },
    getGrabOffset() {
      return grabOffset ?? { x: 0, y: 0 };
    },
  };
}

/** Non-null when grids are wrapped in a `<SnapGridGroup>` (shared cross-grid registry). */
export const SnapGridGroupContext = createContext<GridRegistry | null>(null);
