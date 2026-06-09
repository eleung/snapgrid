import type { DragDropManager } from "@dnd-kit/dom";
import {
  type Compactor,
  type Layout,
  type LayoutItem,
  type PositionParams,
  insertItemWithCompactor,
} from "@snapgridjs/core";
import { getController, getGrabOffset } from "./controller/registry.js";
import type { SnapGridDragData } from "./dnd/dragData.js";
import { dropItemSize, receiveCell } from "./dnd/dragFlow.js";
import { domElement } from "./dnd/entity.js";
import type { GridDropData } from "./types.js";

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
 * By default it resolves the **destination grid** from `event.operation.target`
 * (the grid the pointer is over) and reads that grid's geometry, compactor, and
 * default item size from what it already renders with — so you don't rebuild
 * `PositionParams` by hand. Each `ctx` field overrides one resolved value
 * independently; pass none and everything comes from the target grid.
 *
 * The dragged item's size/id come from a grid tile's move payload
 * (`data.snapGrid.item`) when present, else a foreign source's `data.snapGridDrop`
 * spec, else `ctx.defaultItem`, else the target grid's `dropConfig.defaultItem`,
 * else 1×1 — matching the managed external-drop path.
 */
export interface SnapMoveContext {
  /**
   * The grid's geometry. Omit to resolve it from the target grid's controller
   * (the grid under the pointer, found via `event.operation.target`).
   */
  positionParams?: PositionParams;
  /** Packing algorithm. Omit to resolve from the target grid's controller. */
  compactor?: Compactor;
  /**
   * Size for a foreign (non-grid) source that carries no `snapGridDrop` payload.
   * Falls back to the target grid's `dropConfig.defaultItem`, then `{ w: 1, h: 1 }`.
   */
  defaultItem?: { w: number; h: number };
  /** Override the grid's client rect (else read from the target grid's element). */
  gridRect?: { left: number; top: number };
  /**
   * The dnd-kit manager. Usually unnecessary — `event.operation.target` is a
   * dnd-kit entity that already references its manager. Pass the
   * `onDragOver(event, manager)` 2nd arg only if a target ever lacks one.
   */
  manager?: DragDropManager;
}

/** The dnd-kit drag event shape `snapMove` reads (a `dragover`/`dragend` event). */
export interface SnapMoveEvent {
  operation: {
    source: { id: string | number; data?: unknown } | null;
    /**
     * The drop target — a dnd-kit `Droppable`. snapgrid reads its `id` (the
     * destination grid's `group`) and `manager` to resolve that grid's geometry,
     * compactor, and default item size when the context omits them.
     */
    target: { id?: string | number; manager?: DragDropManager } | null;
    position: { current: { x: number; y: number } };
  };
}

/** Place the event's dragged item into `layout` at the pointer cell; returns the new layout. */
export function snapMove(layout: Layout, event: SnapMoveEvent, ctx: SnapMoveContext = {}): Layout {
  const op = event.operation;
  const source = op.source;
  if (!source) return layout;

  // Resolve the destination grid's controller from the drop target. Its id IS the
  // grid's `group`, and dnd-kit entities reference their manager — so geometry,
  // compactor, rect, grab offset, and default size can all come from the grid the
  // consumer already configured, instead of being rebuilt (and kept in sync) by hand.
  const target = op.target;
  const manager = ctx.manager ?? target?.manager;
  const controller = target?.id != null ? getController(manager, String(target.id)) : undefined;
  const cfg = controller?.config;

  const positionParams = ctx.positionParams ?? cfg?.positionParams;
  const compactor = ctx.compactor ?? cfg?.compactor;
  if (!positionParams || !compactor) {
    throw new Error(
      "snapMove: no grid geometry. Pass { positionParams, compactor } on the context, or call " +
        "it from an onDragOver where event.operation.target is a snapgrid grid (so it can " +
        "resolve them from that grid).",
    );
  }

  // Size + id: a grid tile keeps its own; a foreign source honors its `snapGridDrop`
  // spec (the same way the managed external-drop path does — see dropItemSize), then
  // the configured default sizes.
  const data = source.data as
    | { snapGrid?: SnapGridDragData; snapGridDrop?: GridDropData }
    | undefined;
  const move = data?.snapGrid;
  const isMove = move?.kind === "move";
  const size = isMove
    ? { w: move.item.w, h: move.item.h }
    : dropItemSize(data?.snapGridDrop, ctx.defaultItem ?? cfg?.dropConfig?.defaultItem);
  const id = isMove ? String(source.id) : (data?.snapGridDrop?.i ?? String(source.id));

  // Rect: the resolved grid's own element (authoritative), else the target's element
  // for callers who pass geometry explicitly but no `gridRect`.
  const gridEl = controller?.element ?? domElement(op.target);
  const rect = ctx.gridRect ?? gridEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const p = op.position.current;
  // Account for where within a dragged tile the pointer grabbed it (a foreign card
  // has no recorded grab point → {0,0}), the same mapping the managed engine uses.
  const cell = receiveCell(
    { x: p.x, y: p.y },
    rect,
    getGrabOffset(manager),
    size.w,
    size.h,
    positionParams,
  );

  const item: LayoutItem = { i: id, x: cell.x, y: cell.y, w: size.w, h: size.h };
  // insertItemWithCompactor moves the item if it already exists in `layout`, or
  // inserts it (displacing the occupant of the target cell) if it's new.
  return insertItemWithCompactor(layout, item, cell.x, cell.y, {
    compactor,
    cols: positionParams.cols,
  });
}
