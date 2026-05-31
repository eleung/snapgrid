import { useDraggable } from "@dnd-kit/react";
import { type LayoutItem, calcGridItemPosition } from "@snapgrid/core";
import type { CSSProperties } from "react";
import { useGridRuntime } from "../context.js";
import { NO_FEEDBACK } from "./dndShared.js";

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
 * Headless hook for a single grid item. Returns a ref, a positioning `style`,
 * and drag state — spread them onto whatever element you render. You own the
 * tag, className, content, and any cosmetic styling.
 */
export function useGridItem(id: string): UseGridItemResult {
  const rt = useGridRuntime();
  const item = rt.itemsById.get(id);
  const { ref, isDragging } = useDraggable({
    id,
    type: "grid-item",
    disabled: !rt.isItemDraggable(id),
    sensors: rt.itemSensors,
    plugins: NO_FEEDBACK,
    // Carry the full item so another grid can render/insert it on a cross-grid drop.
    data: { snapGrid: { kind: "move", itemId: id, item } },
  });
  const active = rt.session?.activeId === id;

  let style: CSSProperties = { position: "absolute", touchAction: "none" };
  if (item) {
    const pos = calcGridItemPosition(rt.positionParams, item.x, item.y, item.w, item.h);
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
      // While dragging, the floating preview is rendered in a body portal
      // (see GridDragOverlay), so the in-grid tile is hidden — it still holds
      // its (reflowed) cell. Non-active tiles animate their transform as they
      // reflow around it.
      visibility: active ? "hidden" : undefined,
      transition: active ? "none" : REFLOW_TRANSITION,
      touchAction: "none",
    };
  }

  return { ref, style, isDragging, item };
}
