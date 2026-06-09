import { type Draggable, Feedback } from "@dnd-kit/dom";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import { useSortable } from "@dnd-kit/react/sortable";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { REFLOW_EASING, REFLOW_MS, TILE_TRANSITION } from "../reflow.js";
import { useResolveController } from "./useResolveController.js";

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
// target pool also stops dnd-kit's OptimisticSortingPlugin from reparenting a tile's
// DOM node mid-drag (it acts only when source AND target are sortables) and then
// fighting React's commit (`removeChild`).
const tileNeverTarget = () => null;

export interface UseGridItemOptions {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id, from its {@link useGridContainer} (dnd-kit's `group`). */
  group: string;
  /**
   * The dnd-kit sortable `type` this tile carries. Defaults to `"grid-item"`.
   * Override to namespace tiles for ecosystem interop — e.g. so a foreign
   * sortable list `accept`s only one grid's tiles. The grid recognizes its own
   * tiles by their payload, not this string, so any value still drags + crosses grids.
   */
  type?: string;
}

export interface UseGridItemResult {
  /** Attach to the element that represents this grid item. */
  ref: (element: Element | null) => void;
  /**
   * Optional drag handle (dnd-kit's native handle). Attach to a child element to
   * restrict **pointer** drag activation to it; leave it unattached and the whole
   * tile drags. Keyboard pickup (Enter/Space on a focused tile) is unaffected.
   */
  handleRef: (element: Element | null) => void;
  /** Positioning style to spread onto your element. */
  style: CSSProperties;
  /** True while this item is the active drag source. */
  isDragging: boolean;
  /** The item's current (possibly reflowed) layout entry. */
  item: LayoutItem | undefined;
}

/**
 * Headless hook for a single grid tile. The tile is a real `useSortable` (a
 * draggable + droppable carrying `group`/`index`/`type`/`accept`), so it
 * interoperates with the dnd-kit sortable ecosystem, yet it is positioned by RGL
 * via the {@link GridController}. `group` is the owning grid's id (from its
 * {@link useGridContainer}), mirroring `useSortable`'s `group`. Spread the returned
 * `ref`, optional `handleRef`, positioning `style`, and drag state onto whatever
 * element you render — you own the tag, className, content, and cosmetic styling.
 *
 * The dragged tile floats itself via dnd-kit's default feedback (no `<DragOverlay>`):
 * the active tile renders at its committed origin and dnd-kit's float follows the
 * pointer from there, while reflow is animated on the compositor via the Web
 * Animations API (a FLIP) — both so it stays smooth in Safari, where the float's
 * popover top-layer repaint would jank a CSS-transition reflow.
 *
 * Tiles are positioned with `left`/`top` (not `transform`). dnd-kit's self-float
 * measures the source element's rect ignoring transforms and re-applies its current
 * transform each frame; a transform-positioned tile leans on that, but the
 * compensation is lost the instant the dragged element is swapped for a foreign one
 * mid-drag (grid → sortable interop — the tile becomes a flow card), which would
 * make the float jump by the tile's grid offset. Plain left/top has nothing to lose
 * on the swap, matching how dnd-kit's own flow-positioned sortables hand off cleanly.
 */
export function useGridItem({
  id,
  group,
  type = "grid-item",
}: UseGridItemOptions): UseGridItemResult {
  const controller = useResolveController(group);
  // Subscribe to just this item's slice → a drag elsewhere doesn't re-render it.
  const snap = useSyncExternalStore(
    controller.subscribe,
    () => controller.itemSnapshot(id),
    () => controller.itemSnapshot(id),
  );
  const item = snap.item;
  const active = snap.isDragging;
  // The controller's "pointer move in progress" signal (false for a keyboard drag).
  // We don't hide the tile (it floats itself) — we use it to decide whether to pin
  // the tile at its origin for the float.
  const hidden = snap.hidden;
  const config = controller.config!;

  // True on the single render where the tile goes active → settled (the drop frame):
  // snap to the landed cell instead of sliding there from the committed origin.
  const wasActive = useRef(false);
  const justDropped = wasActive.current && !active;
  wasActive.current = active;

  // Stable identity for the drag payload so dnd-kit doesn't churn on it every
  // render; it changes only when this tile's resolved entry does (a reflow).
  // `group` lets the engine resolve this tile's owning grid from the payload.
  const data = useMemo(
    () => ({ snapGrid: { kind: "move", itemId: id, item, group } }),
    [id, item, group],
  );

  const {
    ref: sortableRef,
    handleRef,
    isDragging,
  } = useSortable({
    id,
    index: controller.itemIndex(id),
    group,
    type,
    accept: type,
    // The tile is a sortable (so it interops + carries group/index), but never a
    // drop target — the grid container is. See {@link tileNeverTarget}.
    collisionDetector: tileNeverTarget,
    disabled: !config.isItemDraggable(id),
    sensors: config.itemSensors,
    modifiers: config.itemModifiers,
    // Keep the sortable defaults (optimistic + keyboard, needed for interop); just
    // append the feedback config.
    plugins: (defaults) => [...defaults, ...ITEM_FEEDBACK],
    // Carry the full item so a receiving grid can render/insert it on a cross-grid drop.
    data,
  });

  // Capture the element to drive the WAAPI reflow, while still feeding the sortable's ref.
  const elRef = useRef<Element | null>(null);
  const setRef = useCallback(
    (element: Element | null) => {
      sortableRef(element);
      elRef.current = element;
    },
    [sortableRef],
  );

  const session = controller.getSession();
  const dragging = session != null;

  // During a POINTER drag the active tile renders at its committed origin so dnd-kit's
  // float offset tracks the pointer; a keyboard drag (and every other tile) renders at
  // the reflowed (preview) cell so it steps with the arrow keys.
  const posItem = item ? (active && hidden ? (session?.anchor.item ?? item) : item) : undefined;
  const pos = posItem
    ? calcGridItemPosition(config.positionParams, posItem.x, posItem.y, posItem.w, posItem.h)
    : undefined;
  const posLeft = pos?.left;
  const posTop = pos?.top;

  // Reflow a tile to its new cell via a compositor FLIP: the resting left/top has
  // already jumped this render, so animate a `transform` delta from the tile's previous
  // visual position back to 0. Drives in-drag reflow AND out-of-drag (responsive /
  // programmatic) changes, and dodges the float's popover repaint that janks a CSS
  // transition in Safari. The drag source settling after a drop is the exception (see
  // the `settleAnchor` branch below).
  const prev = useRef<{ left: number; top: number } | null>(null);
  const reflowAnim = useRef<Animation | null>(null);
  const settleAnchor = useRef<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const cur = posLeft != null && posTop != null ? { left: posLeft, top: posTop } : null;
    const before = prev.current;
    prev.current = cur;
    const el = elRef.current;
    if (!el || !cur) return;

    // Active: dnd-kit owns this tile's motion. Remember the cell it floats from so the
    // post-drop settle can snap instead of FLIP.
    if (active) {
      settleAnchor.current = cur;
      reflowAnim.current?.cancel();
      return;
    }
    // A drag of ANOTHER tile in this grid: this tile reflows normally; drop any stale
    // settle anchor so it FLIPs (it was never floated).
    if (dragging) settleAnchor.current = null;
    // Post-drop settle of the formerly-active source: it was floated, so `before` is the
    // committed origin, not where it visually was — snap (no FLIP) until the committed
    // move lands (cell leaves the anchor). Clearing earlier is unsafe: the drop's commit
    // can arrive a render after `active` clears, and on that frame a pending real move
    // and a no-op drop both read `cur === anchor`. The cost: a true no-op drop leaves the
    // anchor set until the next drag clears it (tiny, accepted — beats reopening the slide).
    else if (settleAnchor.current) {
      const a = settleAnchor.current;
      reflowAnim.current?.cancel();
      if (cur.left !== a.left || cur.top !== a.top) settleAnchor.current = null;
      return;
    }

    if (!before || justDropped) return;
    if (before.left === cur.left && before.top === cur.top) return;
    // Web Animations API may be absent (jsdom / SSR / very old browsers): degrade to
    // an instant move (the left/top below already places the tile) rather than throw.
    if (typeof el.animate !== "function") return;
    // Previous visual position = the prior resting cell plus any in-flight transform.
    let fromX = before.left;
    let fromY = before.top;
    if (reflowAnim.current?.playState === "running") {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      fromX = before.left + m.m41;
      fromY = before.top + m.m42;
    }
    reflowAnim.current?.cancel();
    reflowAnim.current = el.animate(
      [
        { transform: `translate(${fromX - cur.left}px, ${fromY - cur.top}px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: REFLOW_MS, easing: REFLOW_EASING },
    );
  }, [posLeft, posTop, active, justDropped, dragging]);

  // Cancel any in-flight reflow animation when the tile unmounts (e.g. removed
  // mid-drag during a cross-grid move) so a running Animation can't outlive its node.
  useEffect(() => () => reflowAnim.current?.cancel(), []);

  // Tiles rest on left/top (see the hook doc above); position animates via the FLIP
  // above, so the transition is SIZE-only (TILE_TRANSITION) — and "none" while dragging
  // (FLIP owns motion) or just-dropped (it snaps). The active tile (⊂ dragging) hits "none".
  const style: CSSProperties = pos
    ? {
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        transition: justDropped || dragging ? "none" : TILE_TRANSITION,
        touchAction: "none",
      }
    : { position: "absolute", touchAction: "none" };

  return { ref: setRef, handleRef, style, isDragging, item };
}
