import type { DragDropManager } from "@dnd-kit/dom";
import {
  type LayoutItem,
  beginDrag,
  beginReceive,
  beginResize,
  calcGridItemPosition,
  commitLayout,
  dragResize,
  dragTo,
  hideActive,
  nudge,
  removeItemWithCompactor,
} from "@snapgridjs/core";
import type { GridController } from "../controller/GridController.js";
import { getController, getGrabOffset, setGrabOffset } from "../controller/registry.js";
import type { SnapGridDragData } from "./dragData.js";
import {
  arrowStep,
  classifyDrop,
  dragData,
  externalDropSpec,
  receiveCell,
  scrollAdjustedPointer,
} from "./dragFlow.js";
import { domElement } from "./entity.js";

/**
 * The drag/resize/receive engine — ONE per dnd-kit manager, driving every grid
 * on it. Previously this logic lived in each grid's `useGridController` (N grids
 * = N monitors); centralizing it makes the brain framework-agnostic (it touches
 * no React) and lets a tile cross grids through one set of handlers. Per-grid
 * geometry, compaction, gates, and callbacks are read from each grid's published
 * {@link GridController} config; which grid the pointer is over comes from the
 * collision target, and the source grid from the drag payload's `group`.
 *
 * Attached via {@link attachEngine} (a per-manager, ref-counted singleton) so it
 * works the same whether the turnkey components own the `DragDropProvider` or a
 * headless consumer supplies their own — no provider plugin registration needed.
 */

type Point = { x: number; y: number };
type DragSource = { id: string | number; type?: unknown; data?: unknown } | null;
// The slice of a dnd-kit drag operation #move needs. Both the live operation
// (`manager.dragOperation`) and the `dragmove` event's snapshot satisfy it.
type DragOperationView = {
  position: { current: Point };
  source: DragSource;
  target: { id: string | number } | null;
  activatorEvent: Event | null;
};

const hasWindow = typeof window !== "undefined";
// Capture so non-bubbling scroll events from any scrollable ancestor reach us
// (matching how dnd-kit's own ScrollListener binds); passive since we never
// preventDefault a scroll.
const SCROLL_LISTENER_OPTIONS = { capture: true, passive: true } as const;

/** A grid element's top-left in client (viewport) space, or null if unknown. */
function rectOrigin(el: Element | null): Point | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top };
}

function dragCtx(ctrl: GridController) {
  const cfg = ctrl.config!;
  return {
    positionParams: cfg.positionParams,
    compactor: cfg.compactor,
    cols: cfg.gridConfig.cols,
  };
}

/** Map a client-space pointer to a cell within `ctrl`, via its element rect. */
function cellFromPointer(
  ctrl: GridController,
  pointer: Point,
  item: { w: number; h: number },
  manager: DragDropManager,
): Point | null {
  const el = ctrl.element;
  const cfg = ctrl.config;
  if (!el || !cfg) return null;
  const rect = el.getBoundingClientRect();
  return receiveCell(pointer, rect, getGrabOffset(manager), item.w, item.h, cfg.positionParams);
}

class SnapGridEngine {
  #manager: DragDropManager;
  #unsub: Array<() => void> = [];

  // Active-drag state — one drag at a time per manager.
  #source: GridController | null = null; // the owning grid (move/resize)
  #dest: GridController | null = null; // current receiving grid (≠ source), if any
  #keyboard = false;
  #dropSpec: { i: string; w: number; h: number } | null = null; // external draggable
  #dropCounter = 0;
  // The source grid's client-rect origin at drag start. The source-owned session
  // (in-grid move / resize) derives its target from a pointer delta against
  // offsets captured at start; comparing this against the grid's *live* origin
  // tells us how far it has scrolled so we can re-anchor the pointer (issue #49).
  #sourceStartOrigin: Point | null = null;
  // A scroll listener is bound only for the duration of a drag (see #bindScroll).
  #scrollBound = false;
  // Per-drag cache so a continuous drag (pointer over one grid for many frames)
  // doesn't re-resolve the destination controller on every move.
  #lastTargetId: string | number | null = null;
  #lastDest: GridController | undefined = undefined;

  constructor(manager: DragDropManager) {
    this.#manager = manager;
    const mon = manager.monitor;
    this.#unsub.push(
      mon.addEventListener("dragstart", (event) => {
        const op = event.operation;
        const p = op.position.current;
        this.#start(
          dragData(event),
          { x: p.x, y: p.y },
          op.source as DragSource,
          op.activatorEvent,
        );
        // dnd-kit emits no `dragmove` while the page auto-scrolls, so listen for
        // scroll ourselves and recompute the drag against the grid's live rect.
        this.#bindScroll();
      }),
      mon.addEventListener("dragmove", (event) => this.#moveFromOperation(event.operation)),
      mon.addEventListener("dragend", (event) => {
        const op = event.operation;
        this.#end(
          dragData(event),
          op.target?.id ?? null,
          event.nativeEvent ?? null,
          event.canceled,
        );
      }),
    );
    // Keyboard dragging needs a window listener; guard so a framework-agnostic
    // binding can construct the engine in a non-DOM (SSR) context without throwing.
    if (hasWindow) window.addEventListener("keydown", this.#onKeyDown, true);
  }

  destroy(): void {
    for (const u of this.#unsub) u();
    this.#unsub = [];
    if (hasWindow) window.removeEventListener("keydown", this.#onKeyDown, true);
    this.#unbindScroll();
  }

  #reset(): void {
    this.#source = null;
    this.#dest = null;
    this.#keyboard = false;
    this.#dropSpec = null;
    this.#sourceStartOrigin = null;
    this.#lastTargetId = null;
    this.#lastDest = undefined;
  }

  /** Resolve the grid under the pointer from the collision target id (cached per drag). */
  #resolveDest(targetId: string | number | null): GridController | undefined {
    if (targetId == null) return undefined;
    if (targetId !== this.#lastTargetId) {
      this.#lastTargetId = targetId;
      this.#lastDest = getController(this.#manager, String(targetId));
    }
    return this.#lastDest;
  }

  // Switch the current receiving grid, clearing the previous one's preview (unless
  // it's the source grid, whose own session is managed separately).
  #setDest(next: GridController | null): void {
    if (this.#dest && this.#dest !== next && this.#dest !== this.#source) {
      this.#dest.setSession(null);
    }
    this.#dest = next;
  }

  #start(
    data: SnapGridDragData | undefined,
    pointer: Point,
    source: DragSource,
    activatorEvent: Event | null,
  ): void {
    this.#reset();
    if (!data) return; // external: spec is minted lazily on move over an accepting grid
    const owner = getController(this.#manager, data.group);
    const cfg = owner?.config;
    if (!owner || !cfg) return;
    const layout = owner.getCommitted();
    const item = layout.find((it) => it.i === data.itemId);
    if (!item) return;
    // Snapshot the grid's viewport origin so the source-owned session can correct
    // for scroll on every later frame (see #sourceStartOrigin / scrollAdjustedPointer).
    this.#sourceStartOrigin = rectOrigin(owner.element);

    if (data.kind === "resize") {
      const rect = calcGridItemPosition(cfg.positionParams, item.x, item.y, item.w, item.h);
      owner.setSession(beginResize(layout, { item, rect, pointer }, data.handle));
      this.#source = owner;
      owner.setKeyboard(false); // clear any stale flag; resize is never keyboard-flagged
      cfg.callbacks.onResizeStart?.(layout, item, item, item, activatorEvent, null);
      return;
    }

    const isKeyboard = hasWindow && activatorEvent instanceof KeyboardEvent;
    this.#keyboard = isKeyboard;
    owner.setKeyboard(isKeyboard);
    const rect = calcGridItemPosition(cfg.positionParams, item.x, item.y, item.w, item.h);
    owner.setSession(beginDrag(layout, { item, left: rect.left, top: rect.top, pointer }));
    this.#source = owner;
    // Share the grab offset (pointer within the tile) so a receiving grid maps the
    // pointer to the cell under the grabbed point, not the tile's corner.
    const cr = domElement(source)?.getBoundingClientRect();
    if (cr) setGrabOffset(this.#manager, { x: pointer.x - cr.left, y: pointer.y - cr.top });
    cfg.callbacks.onDragStart?.(layout, item, item, item, activatorEvent, null);
  }

  #move(
    data: SnapGridDragData | undefined,
    pointer: Point,
    source: DragSource,
    targetId: string | number | null,
    activatorEvent: Event | null,
  ): void {
    if (this.#keyboard) return; // keyboard moves are driven by the arrow-key handler
    const owner = this.#source;

    // Resize: advance the source grid's resize session.
    const ownerSession = owner?.getSession();
    if (owner && ownerSession?.kind === "resize") {
      const cfg = owner.config!;
      const adjusted = scrollAdjustedPointer(
        pointer,
        this.#sourceStartOrigin,
        rectOrigin(owner.element),
      );
      const next = dragResize(ownerSession, adjusted, dragCtx(owner));
      owner.setSession(next);
      cfg.callbacks.onResize?.(
        next.preview,
        next.anchor.item,
        next.placeholder,
        next.placeholder,
        activatorEvent,
        null,
      );
      return;
    }

    const destCtrl = this.#resolveDest(targetId);

    if (!data) {
      // No snapgrid payload: either a true external draggable, OR a grid tile whose
      // element was swapped for a foreign one mid-drag (interop: it became a sortable
      // card). In the latter case the source grid still holds a "move" session from the
      // last in-grid frame — hide its placeholder so it doesn't linger while the drag is
      // over the foreign target. (A true external drag has no `owner`, so this is a no-op.)
      if (owner) {
        const cur = owner.getSession();
        if (cur?.placeholder) owner.setSession(hideActive(cur));
      }
      // External (non-grid) draggable: preview where it would land over a grid that accepts it.
      this.#setDest(destCtrl ? this.#receiveExternalInto(destCtrl, source, pointer) : null);
      return;
    }
    if (data.kind !== "move") return;

    // Moving within the source grid.
    if (owner && destCtrl === owner) {
      this.#setDest(null);
      const cur = owner.getSession();
      if (!cur) return;
      const cfg = owner.config!;
      const adjusted = scrollAdjustedPointer(
        pointer,
        this.#sourceStartOrigin,
        rectOrigin(owner.element),
      );
      const next = dragTo(cur, adjusted, dragCtx(owner));
      owner.setSession(next);
      cfg.callbacks.onDrag?.(
        next.preview,
        next.anchor.item,
        next.placeholder,
        next.placeholder,
        activatorEvent,
        null,
      );
      return;
    }

    // Leaving the source grid (if we resolved one): hide its placeholder, keep its
    // items in place (the dragged tile floats itself across grids — no overlay).
    if (owner) {
      const cur = owner.getSession();
      if (cur) {
        const cfg = owner.config!;
        const hidden = hideActive(cur);
        owner.setSession(hidden);
        cfg.callbacks.onDrag?.(
          hidden.preview,
          hidden.anchor.item,
          null,
          null,
          activatorEvent,
          null,
        );
      }
    }
    // Receive the tile into the destination grid. Independent of whether the source
    // grid resolved, so a desynced source can't block another grid from receiving.
    this.#setDest(
      destCtrl && destCtrl !== owner ? this.#receiveInto(destCtrl, data.item, pointer) : null,
    );
  }

  /** Build a receive preview for `foreign` in `dest`; returns `dest` on success, else null. */
  #receiveInto(dest: GridController, foreign: LayoutItem, pointer: Point): GridController | null {
    if (!dest.config) return null;
    const committed = dest.getCommitted();
    const cell = cellFromPointer(dest, pointer, foreign, this.#manager) ?? { x: 0, y: 0 };
    dest.setSession(beginReceive(committed, foreign, cell.x, cell.y, pointer, dragCtx(dest)));
    return dest;
  }

  /** Receive an external (non-grid) draggable into `dest`, synthesizing its item. */
  #receiveExternalInto(
    dest: GridController,
    source: DragSource,
    pointer: Point,
  ): GridController | null {
    const spec = this.#externalSpecFor(dest, source);
    if (!spec) return null;
    return this.#receiveInto(dest, { i: spec.i, x: 0, y: 0, w: spec.w, h: spec.h }, pointer);
  }

  // Synthesize a stable id/size for an external draggable the first time it's over
  // an accepting grid; re-check acceptance per grid, but keep the id stable so the
  // preview item doesn't churn as the pointer moves between grids.
  #externalSpecFor(
    dest: GridController,
    source: DragSource,
  ): { i: string; w: number; h: number } | null {
    const spec = externalDropSpec(source, dest.config?.dropConfig);
    if (!spec) return null;
    if (!this.#dropSpec) {
      this.#dropCounter += 1;
      this.#dropSpec = {
        i: spec.i ?? `${dest.id}-dropped-${this.#dropCounter}`,
        w: spec.w,
        h: spec.h,
      };
    }
    return this.#dropSpec;
  }

  #end(
    data: SnapGridDragData | undefined,
    targetId: string | number | null,
    nativeEvent: Event | null,
    canceled: boolean,
  ): void {
    const source = this.#source;
    const dest = this.#dest;
    try {
      // Source grid (the owner): owns the drag's start/stop pair and the resize path.
      if (source) {
        const cfg = source.config!;
        const cur = source.getSession();
        // The item leaves the source ONLY if a grid actually received it (a live
        // receive session in #dest). Otherwise it's an in-grid move (pointer/keyboard
        // over the source) or a revert — never a remove keyed off a racy drop target
        // that no grid committed (which would lose the tile).
        const destId = dest
          ? dest.id
          : this.#keyboard || (targetId != null && String(targetId) === source.id)
            ? source.id
            : null;
        const action = classifyDrop({
          kind: cur?.kind ?? null,
          canceled,
          ownsItem: true,
          hasData: !!data,
          dest: destId,
          myId: source.id,
        });
        switch (action) {
          case "cancel-resize":
            cfg.callbacks.onResizeStop?.(
              source.getCommitted(),
              cur?.anchor.item ?? null,
              null,
              null,
              nativeEvent,
              null,
            );
            break;
          case "cancel-move":
            cfg.callbacks.onDragStop?.(
              source.getCommitted(),
              cur?.anchor.item ?? null,
              null,
              null,
              nativeEvent,
              null,
            );
            break;
          case "commit-resize":
            if (cur) {
              cfg.callbacks.onLayoutChange?.(commitLayout(cur));
              cfg.callbacks.onResizeStop?.(
                cur.preview,
                cur.anchor.item,
                cur.placeholder,
                cur.placeholder,
                nativeEvent,
                null,
              );
            }
            break;
          case "commit-in-grid":
          case "remove-source":
          case "revert": {
            if (action === "commit-in-grid" && cur) {
              cfg.callbacks.onLayoutChange?.(commitLayout(cur));
            } else if (action === "remove-source" && data) {
              const { compactor, cols } = dragCtx(source);
              cfg.callbacks.onLayoutChange?.(
                removeItemWithCompactor(source.getCommitted(), data.itemId, { compactor, cols }),
              );
            } // "revert" → dropped outside any grid → no layout change.
            cfg.callbacks.onDragStop?.(
              cur?.preview ?? source.getCommitted(),
              cur?.anchor.item ?? null,
              cur?.placeholder ?? null,
              cur?.placeholder ?? null,
              nativeEvent,
              null,
            );
            break;
          }
        }
      }

      // Destination grid (receiver): #dest holds the live receive session, so it IS
      // the landing grid — commit it regardless of the (possibly racy) drop target.
      if (dest && dest !== source) {
        const cfg = dest.config!;
        const cur = dest.getSession();
        const action = classifyDrop({
          kind: cur?.kind ?? null,
          canceled,
          ownsItem: false,
          hasData: !!data,
          dest: dest.id,
          myId: dest.id,
        });
        if (action === "commit-dest") {
          if (cur) cfg.callbacks.onLayoutChange?.(commitLayout(cur));
        } else if (action === "external-drop" && cur) {
          const committed = commitLayout(cur);
          const dropped = committed.find((it) => it.i === cur.activeId);
          if (dropped) cfg.callbacks.onDrop?.(committed, dropped, nativeEvent);
        }
      }
    } finally {
      // Always clean up, even if a consumer callback above threw — otherwise a stale
      // session / keyboard flag / grab offset / scroll listener would leak into the
      // next drag.
      this.#unbindScroll();
      setGrabOffset(this.#manager, null);
      source?.setKeyboard(false);
      source?.setSession(null);
      if (dest && dest !== source) dest.setSession(null);
      this.#reset();
    }
  }

  // Drive #move from a dnd-kit drag operation — shared by the `dragmove` monitor
  // event and the scroll-driven recompute below, which pass the same object.
  #moveFromOperation(op: DragOperationView): void {
    const p = op.position.current;
    this.#move(
      dragData({ operation: op }),
      { x: p.x, y: p.y },
      op.source as DragSource,
      op.target?.id ?? null,
      op.activatorEvent ?? null,
    );
  }

  // ── Scroll tracking ───────────────────────────────────────────────────────
  // The page (or an ancestor) scrolling mid-drag moves the grid under a possibly
  // still pointer, but dnd-kit emits no `dragmove` for it — it only re-runs
  // collision. So recompute the active drag ourselves against the grid's live rect
  // (the pointer stays put in viewport space; scrolling doesn't move it), which
  // lets the placeholder keep advancing — e.g. auto-scrolling to the bottom (#49).
  // Bound only for the span of a drag; dnd-kit's autoscroll scrolls at most once
  // per frame, so a direct recompute is already frame-paced.
  #bindScroll(): void {
    if (!hasWindow || this.#scrollBound) return;
    this.#scrollBound = true;
    window.addEventListener("scroll", this.#onScroll, SCROLL_LISTENER_OPTIONS);
  }

  #unbindScroll(): void {
    if (!hasWindow || !this.#scrollBound) return;
    this.#scrollBound = false;
    window.removeEventListener("scroll", this.#onScroll, SCROLL_LISTENER_OPTIONS);
  }

  #onScroll = (): void => {
    if (this.#keyboard) return; // keyboard drags step by cell, not by pointer
    const op = this.#manager.dragOperation;
    if (op.status.dragging) this.#moveFromOperation(op);
  };

  #onKeyDown = (e: KeyboardEvent): void => {
    if (!this.#keyboard) return;
    const source = this.#source;
    const session = source?.getSession();
    if (!source || !session || session.kind !== "move") return;
    const step = arrowStep(e.key);
    if (!step) return; // Enter/Space (drop) and Escape (cancel) → dnd-kit's KeyboardSensor
    e.preventDefault();
    // Own the arrow: stop dnd-kit's KeyboardSensor (a document capture listener) from
    // also moving — we run in capture on window, ahead of it.
    e.stopImmediatePropagation();
    source.setSession(nudge(session, step[0], step[1], dragCtx(source)));
  };
}

// One engine per manager, ref-counted by the number of mounted grids so the
// monitor + window listeners are torn down when the last grid for a manager
// unmounts (no leak holding the manager alive via the window keydown listener).
const engines = new WeakMap<DragDropManager, { engine: SnapGridEngine; refs: number }>();

/** Ensure the engine is attached to `manager`; returns a detach (ref-decrement) fn. */
export function attachEngine(manager: DragDropManager): () => void {
  let entry = engines.get(manager);
  if (!entry) {
    entry = { engine: new SnapGridEngine(manager), refs: 0 };
    engines.set(manager, entry);
  }
  entry.refs += 1;
  // Idempotent: a binding (or a double-invoked effect cleanup) calling detach twice
  // must not over-decrement and tear the engine down while other grids are mounted.
  let detached = false;
  return () => {
    if (detached) return;
    detached = true;
    const e = engines.get(manager);
    if (!e) return;
    e.refs -= 1;
    if (e.refs <= 0) {
      e.engine.destroy();
      engines.delete(manager);
    }
  };
}
