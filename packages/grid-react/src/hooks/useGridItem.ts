import { useDraggable } from "@dnd-kit/react";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { type CSSProperties, useSyncExternalStore } from "react";
import { ITEM_FEEDBACK } from "./dndShared.js";
import { useResolveController } from "./useResolveController.js";

export interface UseGridItemResult {
  /** Attach to the element that represents this grid item. */
  ref: (element: Element | null) => void;
  /** Positioning style to spread onto your element (left/top/size). */
  style: CSSProperties;
  /** True while this item is the active drag source. */
  isDragging: boolean;
  /** The item's current (possibly reflowed) layout entry. */
  item: LayoutItem | undefined;
}

// Animate the compositor-only `transform` (and the size, which only changes on
// resize), never `left`/`top`. Animating `left`/`top` is a layout property —
// reflow + repaint every frame for every tile that moves — which collapses large
// grids to single-digit fps in WebKit/Safari. `translate()` stays on the GPU.
const REFLOW_TRANSITION = "transform 150ms ease, width 150ms ease, height 150ms ease";

/**
 * Headless hook for a single grid item. `group` is the owning grid's id (from
 * its {@link useGridContainer}), mirroring useSortable's `group`. Returns a ref,
 * a positioning `style`, and drag state — spread them onto whatever element you
 * render. You own the tag, className, content, and any cosmetic styling.
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
  const hidden = snap.hidden;
  const config = controller.config!;
  const { ref, isDragging } = useDraggable({
    id,
    type: "grid-item",
    disabled: !config.isItemDraggable(id),
    sensors: config.itemSensors,
    modifiers: config.itemModifiers,
    plugins: ITEM_FEEDBACK,
    // Carry the full item so another grid can render/insert it on a cross-grid drop.
    data: { snapGrid: { kind: "move", itemId: id, item } },
  });

  let style: CSSProperties = { position: "absolute", touchAction: "none" };
  if (item) {
    const pos = calcGridItemPosition(config.positionParams, item.x, item.y, item.w, item.h);
    style = {
      position: "absolute",
      // Position via a GPU transform, not left/top — see REFLOW_TRANSITION. The
      // element is pinned at the origin and translated into its cell; size stays
      // as width/height (it only changes on resize, not on drag reflow).
      left: 0,
      top: 0,
      width: pos.width,
      height: pos.height,
      transform: `translate(${pos.left}px, ${pos.top}px)`,
      // `hidden` is set for a pointer drag (the clone floats in the overlay); the
      // tile still holds its reflowed cell. Non-active tiles animate as they
      // reflow around the active one; the active tile itself doesn't animate.
      visibility: hidden ? "hidden" : undefined,
      transition: active ? "none" : REFLOW_TRANSITION,
      touchAction: "none",
    };
  }

  return { ref, style, isDragging, item };
}
