import { type Draggable, Feedback } from "@dnd-kit/dom";
import { OptimisticSortingPlugin } from "@dnd-kit/dom/sortable";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import { createSortable } from "@dnd-kit/svelte/sortable";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { getGridContext } from "../context.js";
import { controllerTick } from "../reactivity.svelte.js";
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

// A grid tile is never itself a drop target — the grid CONTAINER (a separate,
// higher-priority droppable) is what a drag resolves onto. Keeping tiles out of the
// target pool also stops the sortable optimistic-sorting reparenting from fighting
// Svelte's {#each} reconciler.
const tileNeverTarget = () => null;

export interface UseGridItemOptions {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id, from its {@link createGridContainer} (dnd-kit's `group`). */
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
   * Svelte attachment for the tile element: `<div {@attach item.attach}>`.
   * Feeds the sortable and captures the node for the reflow FLIP.
   */
  attach: (node: HTMLElement) => () => void;
  /**
   * Optional drag-handle attachment. Attach to a child element to restrict
   * **pointer** drag activation to it; omit and the whole tile drags. Keyboard
   * pickup (Enter/Space on a focused tile) is unaffected.
   */
  attachHandle: (node: HTMLElement) => () => void;
  /** Reactive inline-style string (position + size). */
  readonly style: string;
  /** True while this item is the active drag source. */
  readonly isDragging: boolean;
  /** The item's current (possibly reflowed) layout entry. */
  readonly item: LayoutItem | undefined;
}

/**
 * Headless factory for a single grid tile. The tile is a real `createSortable` (a
 * draggable + droppable carrying `group`/`index`/`type`), so it interoperates with
 * the dnd-kit sortable ecosystem, yet it is positioned by RGL via the controller.
 * `group` is the owning grid's id (from its {@link createGridContainer}).
 *
 * The dragged tile floats itself via dnd-kit's default feedback (no drag overlay):
 * the active tile renders at its committed origin and dnd-kit's float follows the
 * pointer, while reflow is animated on the compositor via the Web Animations API (a
 * FLIP) — both so it stays smooth in Safari. Tiles rest on `left`/`top` (not
 * `transform`) so the float hands off cleanly when a tile is swapped for a foreign
 * one mid-drag (grid → sortable interop).
 *
 * Must be called during component initialization, inside a grid container.
 */
export function createGridItem(opts: UseGridItemOptions): GridItemHandle {
  const { id, group, type = "grid-item" } = opts;
  const { controller, version } = getGridContext(group);
  const tick = controllerTick(controller);

  // This item's slice — re-read on drag-state changes (tick) and config/committed
  // republish (version). A drag elsewhere still recomputes the derived, but the
  // controller's value-cached snapshot returns a stable reference when nothing in
  // this item's slice changed, so downstream deriveds don't churn.
  const snap = $derived.by(() => {
    version();
    tick();
    return controller.itemSnapshot(id);
  });
  const session = $derived.by(() => {
    tick();
    return controller.getSession();
  });

  const item = $derived(snap.item);
  const active = $derived(snap.isDragging);
  // The "pointer move in progress" signal (false for a keyboard drag): used to pin
  // the tile at its origin for the float, not to hide it (it floats itself).
  const hidden = $derived(snap.hidden);
  const dragging = $derived(session != null);

  // Stable-ish drag payload; `group` lets the engine resolve this tile's owning grid.
  const data = $derived({ snapGrid: { kind: "move", itemId: id, item, group } });

  // During a POINTER drag the active tile renders at its committed origin so dnd-kit's
  // float offset tracks the pointer; a keyboard drag (and every other tile) renders at
  // the reflowed (preview) cell so it steps with the arrow keys.
  const posItem = $derived.by(() => {
    version();
    const it = item;
    if (!it) return undefined;
    return active && hidden ? (session?.anchor.item ?? it) : it;
  });
  const pos = $derived.by(() => {
    version();
    const pi = posItem;
    if (!pi) return undefined;
    const config = controller.config;
    if (!config) return undefined;
    return calcGridItemPosition(config.positionParams, pi.x, pi.y, pi.w, pi.h);
  });

  const sortable = createSortable({
    get id() {
      return id;
    },
    get index() {
      // itemIndex(id) is assigned once and stable for this tile's life (config- and
      // drag-independent), so no reactive dep is read here — a spurious one would
      // re-run the sortable's index effect (refreshShape) on every unrelated republish.
      return controller.itemIndex(id);
    },
    get group() {
      return group;
    },
    get type() {
      return type;
    },
    get accept() {
      return type;
    },
    // The tile is a sortable (so it interops + carries group/index), but never a
    // drop target — the grid container is. See {@link tileNeverTarget}.
    collisionDetector: tileNeverTarget,
    get disabled() {
      version();
      return !controller.config?.isItemDraggable(id);
    },
    get sensors() {
      version();
      return controller.config?.itemSensors;
    },
    get modifiers() {
      version();
      return controller.config?.itemModifiers;
    },
    // Drop the optimistic-sorting plugin (it reorders DOM nodes and fights Svelte's
    // {#each} reconciler) and append the grid tile's feedback config.
    plugins: (defaults) => [
      ...defaults.filter((p) => p !== OptimisticSortingPlugin),
      ...ITEM_FEEDBACK,
    ],
    // Carry the full item so a receiving grid can render/insert it on a cross-grid drop.
    get data() {
      return data;
    },
  });

  // The tile element, captured for the WAAPI reflow while still feeding the sortable.
  let el: HTMLElement | null = null;
  const attach = (node: HTMLElement): (() => void) => {
    const cleanup = sortable.attach(node);
    el = node;
    return () => {
      cleanup?.();
      if (el === node) el = null;
    };
  };

  // True on the single update where the tile goes active → settled (the drop frame):
  // snap to the landed cell instead of sliding there from the committed origin.
  // Recomputed on any positional/drag change (the Svelte analog of "every render"),
  // so it is set only on the frame the tile stops being the drag source and cleared
  // on the next change regardless of its cause.
  let wasActive = false;
  let justDropped = $state(false);
  $effect.pre(() => {
    const a = active;
    void dragging;
    void pos;
    justDropped = wasActive && !a;
    wasActive = a;
  });

  // Reflow a tile to its new cell via a compositor FLIP: the resting left/top has
  // already jumped this update, so animate a `transform` delta from the tile's
  // previous visual position back to 0. Drives in-drag reflow AND out-of-drag
  // (responsive / programmatic) changes, and dodges the float's popover repaint that
  // janks a CSS transition in Safari. The drag source settling after a drop is the
  // exception (see the `settleAnchor` branch).
  let prev: { left: number; top: number } | null = null;
  let reflowAnim: Animation | null = null;
  let settleAnchor: { left: number; top: number } | null = null;
  $effect(() => {
    const p = pos;
    const cur = p ? { left: p.left, top: p.top } : null;
    const isActive = active;
    const isDragging = dragging;
    const dropped = justDropped;
    const before = prev;
    prev = cur;
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
    // Web Animations API may be absent (jsdom / SSR / very old browsers): degrade to
    // an instant move (the left/top already places the tile) rather than throw.
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
  });

  // Cancel any in-flight reflow animation when the tile unmounts (e.g. removed
  // mid-drag during a cross-grid move) so a running Animation can't outlive its node.
  $effect(() => () => reflowAnim?.cancel());

  // Tiles rest on left/top (see the doc above); position animates via the FLIP, so the
  // CSS transition is SIZE-only — and "none" while dragging (FLIP owns motion) or
  // just-dropped (it snaps).
  const style = $derived.by(() => {
    const p = pos;
    if (!p) return "position: absolute; touch-action: none;";
    const transition = justDropped || dragging ? "none" : TILE_TRANSITION;
    return `position: absolute; left: ${p.left}px; top: ${p.top}px; width: ${p.width}px; height: ${p.height}px; transition: ${transition}; touch-action: none;`;
  });

  return {
    attach,
    attachHandle: (node: HTMLElement) => sortable.attachHandle(node),
    get style() {
      return style;
    },
    get isDragging() {
      return sortable.isDragging;
    },
    get item() {
      return item;
    },
  };
}
