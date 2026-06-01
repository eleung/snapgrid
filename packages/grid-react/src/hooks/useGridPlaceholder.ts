import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { type CSSProperties, useSyncExternalStore } from "react";
import { useGridRuntime } from "../context.js";

export interface GridPlaceholderInfo {
  /** The layout entry marking where the dragged item will land. */
  item: LayoutItem;
  /** Positioning style (left/top/size) to spread onto your placeholder element. */
  style: CSSProperties;
}

/**
 * Headless hook returning where the drag placeholder should be rendered, or
 * `null` when no drag is in progress. You render the element however you like.
 */
export function useGridPlaceholder(): GridPlaceholderInfo | null {
  const rt = useGridRuntime();
  const { controller } = rt;
  const placeholder = useSyncExternalStore(
    controller.subscribe,
    controller.placeholderSnapshot,
    controller.placeholderSnapshot,
  );
  if (!placeholder) return null;
  const pos = calcGridItemPosition(
    rt.positionParams,
    placeholder.x,
    placeholder.y,
    placeholder.w,
    placeholder.h,
  );
  const style: CSSProperties = {
    position: "absolute",
    // Transform-positioned to match grid items (see useGridItem) — the
    // placeholder slides as a GPU transform, not an animated left/top.
    left: 0,
    top: 0,
    width: pos.width,
    height: pos.height,
    transform: `translate(${pos.left}px, ${pos.top}px)`,
    pointerEvents: "none",
  };
  return { item: placeholder, style };
}
