import {
  type Compactor,
  type Layout,
  type LayoutItem,
  type PositionParams,
  insertItemWithCompactor,
} from "@snapgridjs/core";
import type { SnapGridDragData } from "./dnd/dragData.js";
import { receiveCell } from "./dnd/dragFlow.js";
import { domElement } from "./dnd/entity.js";

/**
 * The 2-D grid analog of dnd-kit's `move(items, event)` helper — call it from your
 * own `onDragOver`/`onDragEnd` to place the dragged item into a grid's `Layout` at
 * the cell under the pointer (with compaction), and get the new layout back.
 *
 * This is the consumer-facing reducer for **interop with the wider dnd-kit
 * ecosystem** — e.g. dragging a `useSortable` card into a grid, or a grid tile
 * between a grid and a sortable list. At a cross-parent seam (grid ⇄ list) you
 * MUST reduce live in `onDragOver` (dnd-kit reparents the node mid-drag; reducing
 * only on drop desyncs React and throws `removeChild`). Pure snapgrid grids don't
 * need this — their managed engine already handles in-grid and cross-grid drags.
 *
 * The dragged item's size comes from a grid tile's payload (`data.snapGrid.item`)
 * when present, else from `ctx.defaultItem` (default 1×1) for a foreign source.
 */
export interface SnapMoveContext {
  positionParams: PositionParams;
  compactor: Compactor;
  /** Size for a foreign (non-grid) source that carries no snapgrid item. @default {w:1,h:1} */
  defaultItem?: { w: number; h: number };
  /** Override the grid's client rect (else read from the target droppable's element). */
  gridRect?: { left: number; top: number };
}

/** The dnd-kit drag event shape `snapMove` reads (a `dragover`/`dragend` event). */
export interface SnapMoveEvent {
  operation: {
    source: { id: string | number; data?: unknown } | null;
    target: object | null;
    position: { current: { x: number; y: number } };
  };
}

/** Place the event's dragged item into `layout` at the pointer cell; returns the new layout. */
export function snapMove(layout: Layout, event: SnapMoveEvent, ctx: SnapMoveContext): Layout {
  const op = event.operation;
  const source = op.source;
  if (!source) return layout;

  const id = String(source.id);
  const data = (source.data as { snapGrid?: SnapGridDragData } | undefined)?.snapGrid;
  const size =
    data?.kind === "move"
      ? { w: data.item.w, h: data.item.h }
      : (ctx.defaultItem ?? { w: 1, h: 1 });

  const rect = ctx.gridRect ??
    domElement(op.target)?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const p = op.position.current;
  const cell = receiveCell(
    { x: p.x, y: p.y },
    rect,
    { x: 0, y: 0 },
    size.w,
    size.h,
    ctx.positionParams,
  );

  const item: LayoutItem = { i: id, x: cell.x, y: cell.y, w: size.w, h: size.h };
  // insertItemWithCompactor moves the item if it already exists in `layout`, or
  // inserts it (displacing the occupant of the target cell) if it's new.
  return insertItemWithCompactor(layout, item, cell.x, cell.y, {
    compactor: ctx.compactor,
    cols: ctx.positionParams.cols,
  });
}
