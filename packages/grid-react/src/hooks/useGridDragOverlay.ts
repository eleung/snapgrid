import type { LayoutItem } from "@snapgridjs/core";
import type { CSSProperties } from "react";
import { useGridRuntime } from "../context.js";

export interface GridDragOverlay {
  /** The item being dragged from this grid. */
  item: LayoutItem;
  /** Fixed-position style for the floating preview; render it in a body portal. */
  style: CSSProperties;
}

/**
 * Headless hook for the floating drag preview. Returns `null` unless this grid
 * is the source of an in-progress drag. Render the returned `item` with `style`
 * in a portal at `document.body` so it can float across grids unclipped (see
 * {@link GridDragOverlay} for the convenience component).
 */
export function useGridDragOverlay(): GridDragOverlay | null {
  const rt = useGridRuntime();
  const o = rt.overlay;
  if (!o) return null;
  return {
    item: o.item,
    style: {
      position: "fixed",
      left: o.left,
      top: o.top,
      width: o.width,
      height: o.height,
      pointerEvents: "none",
      zIndex: 1000,
    },
  };
}
