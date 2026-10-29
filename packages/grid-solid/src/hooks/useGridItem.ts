import type { Plugins } from "@dnd-kit/abstract";
import { type Draggable, Feedback } from "@dnd-kit/dom";
import { OptimisticSortingPlugin } from "@dnd-kit/dom/sortable";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import { useSortable } from "@dnd-kit/solid/sortable";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { itemTouchAction } from "@snapgridjs/dnd";
import {
  type Accessor,
  type JSX,
  createEffect,
  createMemo,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import { useGridContext } from "../context.js";
import { REFLOW_EASING, REFLOW_MS, TILE_TRANSITION } from "../reflow.js";

// A pointer drag floats the tile via dnd-kit's default feedback; a keyboard drag gets
// `none` (no pointer — the tile steps in place via the session). The drop tween is
// disabled so a pointer drop lands at the cell, not the float origin.
const ITEM_FEEDBACK = [
  Feedback.configure({
    feedback: (_source: Draggable, manager) =>
      isKeyboardEvent(manager.dragOperation.activatorEvent) ? "none" : "default",
    dropAnimation: null,
  }),
];

// Drop the optimistic-sorting plugin (it reorders DOM nodes directly during a drag and
// fights Solid's `<For>` reconciler, just as it fights Vue's `v-for` and Svelte's
// `{#each}`) and append the grid tile's feedback config.
const itemPlugins = (defaults: Plugins): Plugins => [
  ...defaults.filter((p) => p !== OptimisticSortingPlugin),
  ...ITEM_FEEDBACK,
];

// A grid tile is never itself a drop target — the grid CONTAINER (a separate,
// higher-priority droppable) is what a drag resolves onto. Keeping tiles out of the
// target pool also stops the sortable optimistic-sorting reparenting from fighting the
// framework's list reconciler.
const tileNeverTarget = () => null;

export interface UseGridItemOptions {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id, from its {@link useGridContainer} (dnd-kit's `group`). */
  group: string;
  /**
   * The dnd-kit sortable `type` this tile carries. Defaults to `"grid-item"`.
   * Override to namespace tiles for ecosystem interop. The grid recognizes its own
   * tiles by their payload, not this string, so any value still drags + crosses grids.
   */
  type?: string;
}

export interface GridItemHandle {
  /**
   * Ref callback for the tile element: `<div ref={tile.ref}>`. Feeds the sortable and
   * captures the node for the reflow FLIP.
   */
  ref: (el: HTMLElement) => void;
  /**
   * Optional drag-handle ref callback. Bind it to a child element to restrict **pointer**
   * drag activation to that element; omit and the whole tile drags. Keyboard pickup
   * (Enter/Space on a focused tile) is unaffected.
   */
  handleRef: (el: HTMLElement) => void;
  /** Reactive inline style (position + size). */
  style: Accessor<JSX.CSSProperties>;
  /** True while this item is the active drag source. */
  isDragging: Accessor<boolean>;
  /** The item's current (possibly reflowed) layout entry. */
  item: Accessor<LayoutItem | undefined>;
}

/**
 * Headless hook for a single grid tile. The tile is a real `useSortable` (a draggable +
 * droppable carrying `group`/`index`/`type`), so it interoperates with the dnd-kit
 * sortable ecosystem, yet it is positioned by RGL via the controller. `group` is the
 * owning grid's id (from its {@link useGridContainer}).
 *
 * The dragged tile floats itself via dnd-kit's default feedback (no drag overlay): the
 * active tile renders at its committed origin and dnd-kit's float follows the pointer,
 * while reflow is animated on the compositor via the Web Animations API (a FLIP) — both
 * so it stays smooth in Safari. Tiles rest on `left`/`top` (not `transform`) so the float
 * hands off cleanly when a tile is swapped for a foreign one mid-drag (grid → sortable
 * interop).
 *
 * `id` and `group` are read once at setup and are expected to be immutable for the tile's
 * lifetime (tiles are keyed by `i`, and a grid's id is stable) — mirroring the Vue and
 * Svelte bindings. Remount a grid (e.g. inside a keyed `<Show>`) if its id must change.
 *
 * Must be called in a component rendered inside a grid container.
 */
export function useGridItem(opts: UseGridItemOptions): GridItemHandle {
  const { id, group, type = "grid-item" } = opts;
  const { controller, version, tick } = useGridContext(group);

  let element: HTMLElement | undefined;

  // This item's slice — re-read on drag-state changes (tick) and config/committed
  // republish (version). A drag elsewhere still re-evaluates the memo, but the
  // controller's value-cached snapshot returns a stable reference when nothing in this
  // item's slice changed, so downstream memos don't churn.
  const snap = createMemo(() => {
    version();
    tick();
    return controller.itemSnapshot(id);
  });
  const session = createMemo(() => {
    tick();
    return controller.getSession();
  });

  const item = createMemo(() => snap().item);
  const active = createMemo(() => snap().isDragging);
  // The "pointer move in progress" signal (false for a keyboard drag): used to pin the
  // tile at its origin for the float, not to hide it (it floats itself).
  const hidden = createMemo(() => snap().hidden);
  const dragging = createMemo(() => session() != null);

  // During a POINTER drag the active tile renders at its committed origin so dnd-kit's
  // float offset tracks the pointer; a keyboard drag (and every other tile) renders at
  // the reflowed (preview) cell so it steps with the arrow keys.
  const posItem = createMemo(() => {
    const it = item();
    if (!it) return undefined;
    return active() && hidden() ? (session()?.anchor.item ?? it) : it;
  });
  const pos = createMemo(() => {
    version();
    const pi = posItem();
    if (!pi) return undefined;
    const config = controller.config;
    if (!config) return undefined;
    return calcGridItemPosition(config.positionParams, pi.x, pi.y, pi.w, pi.h);
  });

  // Republish-derived sortable inputs, as memos so the sortable's (whole-input) sync
  // effect only re-runs when one actually changes, not on every republish.
  const disabled = createMemo(() => {
    version();
    return !controller.config?.isItemDraggable(id);
  });
  const sensors = createMemo(() => {
    version();
    return controller.config?.itemSensors;
  });
  const modifiers = createMemo(() => {
    version();
    return controller.config?.itemModifiers;
  });

  // Carry the full item so a receiving grid can render/insert it on a cross-grid drop;
  // `group` lets the engine resolve this tile's owning grid. ONE stable object whose `item`
  // is read on demand: dnd-kit's Solid adapter syncs every input in a single effect, so a
  // payload rebuilt per reflow would re-run that whole effect for each moved tile on every
  // pointer step. Untracked, so reading it inside that effect subscribes to nothing.
  const data = {
    snapGrid: {
      kind: "move" as const,
      itemId: id,
      get item() {
        return untrack(item);
      },
      group,
    },
  };

  // dnd-kit's Solid adapter reads each input property inside an effect, so getters make
  // the dynamic ones reactive.
  const sortable = useSortable({
    id,
    // itemIndex(id) is assigned once and stable for this tile's life (config- and
    // drag-independent), so a plain value is enough — a reactive one would re-run the
    // sortable's index effect (refreshShape) on unrelated republishes.
    index: controller.itemIndex(id),
    group,
    type,
    accept: type,
    collisionDetector: tileNeverTarget,
    plugins: itemPlugins,
    get disabled() {
      return disabled();
    },
    get sensors() {
      return sensors();
    },
    get modifiers() {
      return modifiers();
    },
    data,
  });

  const ref = (el: HTMLElement): void => {
    element = el;
    sortable.ref(el);
  };

  // True on the single update where the tile goes active → settled (the drop frame):
  // snap to the landed cell instead of sliding there from the committed origin.
  // Re-evaluated on any positional/drag change (the Solid analog of "every render"), so
  // it is set only on the update the tile stops being the drag source and cleared on the
  // next change regardless of its cause.
  let wasActive = false;
  const justDropped = createMemo(() => {
    dragging();
    pos();
    const a = active();
    const dropped = wasActive && !a;
    wasActive = a;
    return dropped;
  });

  // Reflow a tile to its new cell via a compositor FLIP: the resting left/top has already
  // jumped this update (Solid applies DOM bindings in render effects, which flush before
  // user effects), so animate a `transform` delta from the tile's previous visual
  // position back to 0. Drives in-drag reflow AND out-of-drag (responsive /
  // programmatic) changes, and dodges the float's popover repaint that janks a CSS
  // transition in Safari. The drag source settling after a drop is the exception (see the
  // `settleAnchor` branch). `createEffect` never runs on the server.
  let prev: { left: number; top: number } | null = null;
  let reflowAnim: Animation | null = null;
  let settleAnchor: { left: number; top: number } | null = null;
  createEffect(
    on([pos, active, dragging, justDropped], ([p, isActive, isDragging, dropped]) => {
      const cur = p ? { left: p.left, top: p.top } : null;
      const before = prev;
      prev = cur;
      const el = element;
      if (!el || !cur) return;

      // Active: dnd-kit owns this tile's motion. Remember the cell it floats from so the
      // post-drop settle can snap instead of FLIP.
      if (isActive) {
        settleAnchor = cur;
        reflowAnim?.cancel();
        return;
      }
      // A drag of ANOTHER tile in this grid: this tile reflows normally; drop any stale
      // settle anchor so it FLIPs (it was never floated).
      if (isDragging) {
        settleAnchor = null;
      }
      // Post-drop settle of the formerly-active source: it was floated, so `before` is
      // the committed origin, not where it visually was — snap (no FLIP) until the
      // committed move lands (cell leaves the anchor).
      else if (settleAnchor) {
        const a = settleAnchor;
        reflowAnim?.cancel();
        if (cur.left !== a.left || cur.top !== a.top) settleAnchor = null;
        return;
      }

      if (!before || dropped) return;
      if (before.left === cur.left && before.top === cur.top) return;
      // Web Animations API may be absent (jsdom / very old browsers): degrade to an
      // instant move (the left/top already places the tile) rather than throw.
      if (typeof el.animate !== "function") return;
      // Previous visual position = the prior resting cell plus any in-flight transform.
      let fromX = before.left;
      let fromY = before.top;
      if (reflowAnim?.playState === "running") {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        fromX = before.left + m.m41;
        fromY = before.top + m.m42;
      }
      reflowAnim?.cancel();
      reflowAnim = el.animate(
        [
          { transform: `translate(${fromX - cur.left}px, ${fromY - cur.top}px)` },
          { transform: "translate(0px, 0px)" },
        ],
        { duration: REFLOW_MS, easing: REFLOW_EASING },
      );
    }),
  );

  // Cancel any in-flight reflow animation when the tile unmounts (e.g. removed mid-drag
  // during a cross-grid move) so a running Animation can't outlive its node.
  onCleanup(() => reflowAnim?.cancel());

  // Tiles rest on left/top (see the doc above); position animates via the FLIP, so the
  // CSS transition is SIZE-only — and "none" while dragging (FLIP owns motion) or
  // just-dropped (it snaps). `touch-action` comes from the drag config (see
  // itemTouchAction): with a touch hold, vertical swipes stay with the browser so the
  // page still scrolls from a tile — a touch drag arms by holding first (see
  // buildItemSensors), and once armed dnd-kit's non-passive touchmove listener prevents
  // the scroll itself. With the hold off, the tile keeps `none` (a swipe there would
  // otherwise scroll and drag at once).
  const style = createMemo((): JSX.CSSProperties => {
    version();
    const p = pos();
    const touchAction = itemTouchAction(controller.config?.dragConfig);
    if (!p) return { position: "absolute", "touch-action": touchAction };
    return {
      position: "absolute",
      left: `${p.left}px`,
      top: `${p.top}px`,
      width: `${p.width}px`,
      height: `${p.height}px`,
      transition: justDropped() || dragging() ? "none" : TILE_TRANSITION,
      "touch-action": touchAction,
    };
  });

  return {
    ref,
    handleRef: (el: HTMLElement) => sortable.handleRef(el),
    style,
    isDragging: () => sortable.isDragging() === true,
    item,
  };
}
