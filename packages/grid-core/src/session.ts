import { insertItemWithCompactor, moveItemWithCompactor, resizeItemWithCompactor } from "./move.js";
import {
  type Compactor,
  type Layout,
  type LayoutItem,
  type Position,
  type PositionParams,
  type ResizeHandleAxis,
  calcWH,
  calcXY,
  clamp,
} from "./rgl.js";

/** Snapshot taken at drag start, used to compute movement deltas. */
export interface DragAnchor {
  /** The item being dragged (as it was at drag start). */
  item: LayoutItem;
  /** The item's pixel left at drag start. */
  left: number;
  /** The item's pixel top at drag start. */
  top: number;
  /** The pointer's pixel position at drag start. */
  pointer: { x: number; y: number };
}

/** Geometry + compaction context for a drag step. */
export interface DragContext {
  positionParams: PositionParams;
  compactor: Compactor;
  cols: number;
}

/** Snapshot taken at resize start. */
export interface ResizeAnchor {
  /** The item being resized (as it was at resize start). */
  item: LayoutItem;
  /** The item's pixel rect at resize start. */
  rect: Position;
  /** The pointer's pixel position at resize start. */
  pointer: { x: number; y: number };
}

/** Whether a session is a move or a resize. */
export type DragKind = "move" | "resize";

/** Immutable state of an in-progress drag or resize. */
export interface DragSession {
  /** Whether this is a move or a resize. */
  kind: DragKind;
  /** Id of the item being dragged/resized. */
  activeId: string;
  /** Layout snapshot at start (the base). */
  committed: Layout;
  /** Reflowed layout to render while interacting. */
  preview: LayoutItem[];
  /** The active item's entry in the preview (its target cell/size), or null. */
  placeholder: LayoutItem | null;
  anchor: DragAnchor;
  /** For resize sessions: the handle and the item's pixel rect at start. */
  resize?: { handle: ResizeHandleAxis; startRect: Position };
}

/** Begin a move session for `anchor.item` against the `committed` layout. */
export function beginDrag(committed: Layout, anchor: DragAnchor): DragSession {
  return {
    kind: "move",
    activeId: anchor.item.i,
    committed,
    preview: committed as LayoutItem[],
    placeholder: anchor.item,
    anchor,
  };
}

/** Begin a resize session for `anchor.item` from the given handle. */
export function beginResize(
  committed: Layout,
  anchor: ResizeAnchor,
  handle: ResizeHandleAxis,
): DragSession {
  return {
    kind: "resize",
    activeId: anchor.item.i,
    committed,
    preview: committed as LayoutItem[],
    placeholder: anchor.item,
    anchor: {
      item: anchor.item,
      left: anchor.rect.left,
      top: anchor.rect.top,
      pointer: anchor.pointer,
    },
    resize: { handle, startRect: anchor.rect },
  };
}

/**
 * Advance a drag session: given the current pointer pixel position, compute the
 * target cell and reflow the layout. The active tile floats under the pointer
 * via the body-portal overlay (see the React layer), so no per-tile transform
 * is tracked here.
 */
export function dragTo(
  session: DragSession,
  pointer: { x: number; y: number },
  ctx: DragContext,
): DragSession {
  const { anchor } = session;
  const dx = pointer.x - anchor.pointer.x;
  const dy = pointer.y - anchor.pointer.y;
  const { x, y } = calcXY(
    ctx.positionParams,
    anchor.top + dy,
    anchor.left + dx,
    anchor.item.w,
    anchor.item.h,
  );
  const preview = moveItemWithCompactor(session.committed, anchor.item, x, y, {
    compactor: ctx.compactor,
    cols: ctx.cols,
  });
  const placeholder = preview.find((it) => it.i === anchor.item.i) ?? null;
  return { ...session, preview, placeholder };
}

/**
 * Step a move session by one grid cell — the keyboard analog of {@link dragTo}.
 * Moves the active item from its current preview cell by `(dx, dy)` (clamped to
 * the grid) and reflows. Used for keyboard dragging, where there is no pointer
 * to derive a target cell from. Vertical/horizontal compaction may pull the tile
 * back along the packed axis, exactly as it would for an equivalent pointer drag.
 */
export function nudge(session: DragSession, dx: number, dy: number, ctx: DragContext): DragSession {
  if (session.kind !== "move") return session;
  const { item } = session.anchor;
  const from = session.placeholder ?? item;
  const x = clamp(from.x + dx, 0, Math.max(0, ctx.cols - item.w));
  let y = Math.max(0, from.y + dy);
  // Clamp to the grid's row limit, mirroring calcXY in dragTo — keyboard must
  // not push a tile past maxRows when pointer dragging cannot.
  const { maxRows } = ctx.positionParams;
  if (Number.isFinite(maxRows)) y = Math.min(y, Math.max(0, maxRows - item.h));
  const preview = moveItemWithCompactor(session.committed, item, x, y, {
    compactor: ctx.compactor,
    cols: ctx.cols,
  });
  const placeholder = preview.find((it) => it.i === item.i) ?? null;
  // A downward step that gravity bounces back above the start cell is a no-op
  // (you can't move "down" into a vertical-compacted grid) — never a teleport.
  if (dy > 0 && placeholder && placeholder.y < from.y) return session;
  return { ...session, preview, placeholder };
}

/**
 * Begin (or advance) a session for a tile being received from another grid or
 * from an external draggable: insert `foreign` at cell `(x, y)`, reflow, and
 * snapshot it as the active item. Shared by the cross-grid and external-drop
 * paths so they stay in lockstep.
 */
export function beginReceive(
  committed: Layout,
  foreign: LayoutItem,
  x: number,
  y: number,
  pointer: { x: number; y: number },
  ctx: DragContext,
): DragSession {
  const preview = insertItemWithCompactor(committed, foreign, x, y, {
    compactor: ctx.compactor,
    cols: ctx.cols,
  });
  return {
    kind: "move",
    activeId: foreign.i,
    committed,
    preview,
    placeholder: preview.find((it) => it.i === foreign.i) ?? null,
    anchor: { item: foreign, left: 0, top: 0, pointer },
  };
}

/**
 * Advance a resize session: convert the pointer delta into a new grid size
 * (keeping the anchored edge fixed for west/north handles), clamp to the item's
 * min/max and the grid bounds, then reflow the layout.
 */
export function dragResize(
  session: DragSession,
  pointer: { x: number; y: number },
  ctx: DragContext,
): DragSession {
  const { anchor, resize } = session;
  if (!resize) return session;
  const { handle, startRect } = resize;
  const item = anchor.item;

  // Apply the pointer delta to the moving edges only.
  const dx = pointer.x - anchor.pointer.x;
  const dy = pointer.y - anchor.pointer.y;
  let widthPx = startRect.width;
  let heightPx = startRect.height;
  if (handle.includes("e")) widthPx += dx;
  if (handle.includes("w")) widthPx -= dx;
  if (handle.includes("s")) heightPx += dy;
  if (handle.includes("n")) heightPx -= dy;

  // Convert to grid units (clamped to the grid), then to the item's min/max.
  const { w: rawW, h: rawH } = calcWH(
    ctx.positionParams,
    Math.max(widthPx, 0),
    Math.max(heightPx, 0),
    item.x,
    item.y,
    handle,
  );
  let w = clamp(rawW, Math.max(1, item.minW ?? 1), item.maxW ?? ctx.cols);
  let h = clamp(rawH, Math.max(1, item.minH ?? 1), item.maxH ?? Number.POSITIVE_INFINITY);

  // West/north handles keep the opposite edge anchored.
  let x = item.x;
  let y = item.y;
  if (handle.includes("w")) x = Math.max(0, item.x + item.w - w);
  if (handle.includes("n")) y = Math.max(0, item.y + item.h - h);
  // East/south handles keep the top-left anchored; don't overflow the grid.
  if (!handle.includes("w") && x + w > ctx.cols) w = ctx.cols - x;
  const { maxRows } = ctx.positionParams;
  if (handle.includes("s") && Number.isFinite(maxRows) && y + h > maxRows) h = maxRows - y;

  const preview = resizeItemWithCompactor(
    session.committed,
    item,
    { x, y, w, h },
    { compactor: ctx.compactor, cols: ctx.cols },
  );
  const placeholder = preview.find((it) => it.i === item.i) ?? null;
  return { ...session, preview, placeholder };
}

/** The layout to commit on drop, with react-grid-layout's internal `moved` flag removed. */
export function commitLayout(session: DragSession): LayoutItem[] {
  return stripMoved(session.preview);
}

/**
 * Hide the active tile within its grid: show the committed layout and drop the
 * placeholder. Used when the dragged tile leaves its grid for another — it floats
 * itself across grids (no in-grid overlay), so the source grid shows no preview.
 */
export function hideActive(session: DragSession): DragSession {
  return { ...session, preview: session.committed as LayoutItem[], placeholder: null };
}

/** Drop react-grid-layout's internal `moved` flag before handing layout to the user. */
export function stripMoved(layout: readonly LayoutItem[]): LayoutItem[] {
  return layout.map((it) => {
    if (it.moved === undefined) return it;
    const { moved, ...rest } = it;
    void moved;
    return rest;
  });
}
