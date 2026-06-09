import { type PositionParams, calcXY } from "@snapgridjs/core";
import type { DropConfig, GridDropData } from "../types.js";
import type { SnapGridDragData } from "./dragData.js";

/**
 * Pure decision helpers for the drag interaction so the tricky bits — grab-offset
 * cell mapping, the cross-grid drop lifecycle, and external-drop acceptance — are
 * unit-testable without a DOM or dnd-kit.
 */

/** Read snapgrid's payload off a dnd-kit drag source. */
export function dragData(event: {
  operation: { source?: { data?: unknown } | null };
}): SnapGridDragData | undefined {
  const data = event.operation.source?.data as { snapGrid?: SnapGridDragData } | undefined;
  return data?.snapGrid;
}

/**
 * Resolve a foreign/external source's drop size from its `snapGridDrop` spec,
 * falling back through `dropConfig.defaultItem` to react-grid-layout's 1×1
 * (`defaultDropConfig.defaultItem`) for parity. Shared by the managed external-drop
 * path ({@link externalDropSpec}) and the consumer `snapMove` interop reducer, so
 * both honor the same "external source default size" policy.
 */
export function dropItemSize(
  spec: GridDropData | undefined,
  defaultItem: { w: number; h: number } | undefined,
): { w: number; h: number } {
  return {
    w: spec?.w ?? defaultItem?.w ?? 1,
    h: spec?.h ?? defaultItem?.h ?? 1,
  };
}

/** Size/id spec for an external (non-grid) draggable the grid may accept, or null. */
export function externalDropSpec(
  source: { id: string | number; type?: unknown; data?: unknown } | null | undefined,
  dropConfig: DropConfig | undefined,
): { i?: string; w: number; h: number } | null {
  if (!dropConfig?.enabled || !source) return null;
  const data = source.data as { snapGrid?: unknown; snapGridDrop?: GridDropData } | undefined;
  if (data?.snapGrid) return null; // a grid item, not external
  if (dropConfig.accept && !dropConfig.accept(source)) return null;
  const spec = data?.snapGridDrop;
  return { i: spec?.i, ...dropItemSize(spec, dropConfig.defaultItem) };
}

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

/**
 * Map a keyboard event key to a one-cell grid step while a keyboard drag is
 * active, or null for keys snapgrid doesn't own — Enter/Space (drop) and Escape
 * (cancel) fall through to dnd-kit's KeyboardSensor.
 */
export function arrowStep(key: string): [number, number] | null {
  switch (key) {
    case "ArrowLeft":
      return [-1, 0];
    case "ArrowRight":
      return [1, 0];
    case "ArrowUp":
      return [0, -1];
    case "ArrowDown":
      return [0, 1];
    default:
      return null;
  }
}

/**
 * Which grid a drop commits to, as fed to {@link classifyDrop} as `dest`. A
 * keyboard drag has no pointer, so it can only ever land in its own grid; a
 * pointer drag lands in whichever grid the collision observer resolved (or none).
 */
export function dropDestination(opts: {
  keyboard: boolean;
  targetId: string | number | null | undefined;
  myId: string;
}): string | null {
  if (opts.keyboard) return opts.myId;
  return opts.targetId != null ? String(opts.targetId) : null;
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
