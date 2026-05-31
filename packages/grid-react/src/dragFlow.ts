import { type PositionParams, calcXY } from "@snapgridjs/core";

/**
 * Pure decision helpers for the drag interaction, extracted from
 * {@link SnapGridProvider} so the tricky bits — grab-offset cell mapping and the
 * cross-grid drop lifecycle — are unit-testable without a DOM or dnd-kit.
 */

/**
 * Map a client-space pointer to a grid cell, accounting for where *within* the
 * dragged tile the pointer grabbed it. Subtracting the grab offset means the
 * tile's top-left (not the cursor) maps to the cell, so a received tile's
 * placeholder aligns with the floating overlay instead of jumping its corner to
 * the cursor. External drops pass `{ x: 0, y: 0 }` (no meaningful grab point).
 */
export function receiveCell(
  pointer: { x: number; y: number },
  gridRect: { left: number; top: number },
  grabOffset: { x: number; y: number },
  w: number,
  h: number,
  pp: PositionParams,
): { x: number; y: number } {
  return calcXY(
    pp,
    pointer.y - grabOffset.y - gridRect.top,
    pointer.x - grabOffset.x - gridRect.left,
    w,
    h,
  );
}

/** State gathered by the drag-end handler, fed to {@link classifyDrop}. */
export interface DropState {
  /** Kind of the in-progress session, or null if there is none. */
  kind: "move" | "resize" | null;
  /** Whether the drag was canceled (Esc / abort). */
  canceled: boolean;
  /** Does THIS grid own the dragged item (i.e. it is the source)? */
  ownsItem: boolean;
  /** Is the drag source a grid item (vs. an external draggable)? */
  hasData: boolean;
  /** Id of the grid under the drop pointer, or null if none. */
  dest: string | null;
  /** This grid's id. */
  myId: string;
}

/**
 * What the drag-end handler should do. Each action implies a specific set of
 * callbacks — encoded here so the cross-grid lifecycle contract is explicit and
 * testable:
 *  - `commit-in-grid` / `remove-source` / `revert` all fire `onDragStop` (the
 *    SOURCE grid owns the drag's start/stop pair);
 *  - `commit-dest` fires only `onLayoutChange` — the destination grid never
 *    fired `onDragStart`, so emitting `onDragStop` there would be unbalanced.
 */
export type DropAction =
  | "cancel-resize"
  | "cancel-move"
  | "commit-resize"
  | "commit-in-grid"
  | "remove-source"
  | "revert"
  | "commit-dest"
  | "external-drop"
  | "noop";

/** Pure classification of a drag end. See {@link DropAction}. */
export function classifyDrop(s: DropState): DropAction {
  if (s.canceled) {
    if (s.kind === "resize") return "cancel-resize";
    if (s.ownsItem) return "cancel-move";
    return "noop";
  }
  if (s.kind === "resize") return "commit-resize";

  if (s.ownsItem && s.hasData) {
    if (s.dest === s.myId && s.kind === "move") return "commit-in-grid";
    if (s.dest) return "remove-source";
    return "revert";
  }

  // Not the owner: we can only be a receiving grid, and only with a session.
  if (s.dest === s.myId && s.kind === "move") {
    return s.hasData ? "commit-dest" : "external-drop";
  }
  return "noop";
}
