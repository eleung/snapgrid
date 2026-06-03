import { type Draggable, Feedback } from "@dnd-kit/dom";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import { useSortable } from "@dnd-kit/react/sortable";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import {
  type CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useResolveController } from "./useResolveController.js";

const REFLOW_MS = 150;
const REFLOW_EASING = "ease";
const REFLOW_TRANSITION = `transform ${REFLOW_MS}ms ${REFLOW_EASING}, width ${REFLOW_MS}ms ${REFLOW_EASING}, height ${REFLOW_MS}ms ${REFLOW_EASING}`;

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
 * the active tile renders at its committed origin so the float offset composes, and
 * reflow is animated on the compositor via the Web Animations API — both so it stays
 * smooth in Safari, where the float's popover top-layer repaint would jank a
 * CSS-transition reflow.
 */
export function useGridItem(id: string, group: string): UseGridItemResult {
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

  const {
    ref: sortableRef,
    handleRef,
    isDragging,
  } = useSortable({
    id,
    index: controller.itemIndex(id),
    group,
    type: "grid-item",
    accept: "grid-item",
    disabled: !config.isItemDraggable(id),
    sensors: config.itemSensors,
    modifiers: config.itemModifiers,
    // Keep the sortable defaults (optimistic + keyboard, needed for interop); just
    // append the feedback config.
    plugins: (defaults) => [...defaults, ...ITEM_FEEDBACK],
    // Carry the full item so a receiving grid can render/insert it on a cross-grid drop.
    data: { snapGrid: { kind: "move", itemId: id, item } },
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

  // While dragging, animate a reflowing tile to its new cell on the compositor (a
  // FLIP from its current visual position, so a mid-flight re-target stays smooth).
  // Compositor animations are immune to the float's popover repaint that janks a CSS
  // transition in Safari; outside a drag the CSS transition below handles changes.
  const prev = useRef<{ left: number; top: number } | null>(null);
  const reflowAnim = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const cur = posLeft != null && posTop != null ? { left: posLeft, top: posTop } : null;
    const before = prev.current;
    prev.current = cur;
    const el = elRef.current;
    if (!el || !cur || !before || active || justDropped || !dragging) return;
    if (before.left === cur.left && before.top === cur.top) return;
    let fromX = before.left;
    let fromY = before.top;
    if (reflowAnim.current?.playState === "running") {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      fromX = m.m41;
      fromY = m.m42;
    }
    reflowAnim.current?.cancel();
    reflowAnim.current = el.animate(
      [
        { transform: `translate(${fromX}px, ${fromY}px)` },
        { transform: `translate(${cur.left}px, ${cur.top}px)` },
      ],
      { duration: REFLOW_MS, easing: REFLOW_EASING },
    );
  }, [posLeft, posTop, active, justDropped, dragging]);

  const style: CSSProperties = pos
    ? {
        position: "absolute",
        left: 0,
        top: 0,
        width: pos.width,
        height: pos.height,
        transform: `translate(${pos.left}px, ${pos.top}px)`,
        // During a drag the WAAPI animation owns reflow motion; a CSS transition
        // would get janked (Safari) and double up. Outside a drag, keep it for
        // programmatic layout changes. The active/just-dropped tile never transitions.
        transition: active || justDropped || dragging ? "none" : REFLOW_TRANSITION,
        touchAction: "none",
      }
    : { position: "absolute", touchAction: "none" };

  return { ref: setRef, handleRef, style, isDragging, item };
}
