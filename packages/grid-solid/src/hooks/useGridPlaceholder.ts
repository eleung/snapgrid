import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { type Accessor, type JSX, createMemo } from "solid-js";
import { useGridContext } from "../context.js";

export interface GridPlaceholderInfo {
  /** The layout entry marking where the dragged item will land. */
  item: LayoutItem;
  /** Positioning inline style (size + transform) for your placeholder element. */
  style: JSX.CSSProperties;
}

/**
 * Headless hook returning where the drag placeholder should be rendered, or `null` when
 * no drag is in progress. `group` is the owning grid's id (from its
 * {@link useGridContainer}). Render the element however you like.
 *
 * Must be called in a component rendered inside a grid container.
 */
export function useGridPlaceholder(group: string): Accessor<GridPlaceholderInfo | null> {
  const { controller, version, tick } = useGridContext(group);

  return createMemo((): GridPlaceholderInfo | null => {
    version();
    tick();
    const placeholder = controller.placeholderSnapshot();
    const config = controller.config;
    if (!placeholder || !config) return null;
    const pos = calcGridItemPosition(
      config.positionParams,
      placeholder.x,
      placeholder.y,
      placeholder.w,
      placeholder.h,
    );
    // Transform-positioned to match grid items — the placeholder slides as a GPU
    // transform, not an animated left/top.
    const style: JSX.CSSProperties = {
      position: "absolute",
      left: 0,
      top: 0,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
      transform: `translate(${pos.left}px, ${pos.top}px)`,
      "pointer-events": "none",
    };
    return { item: placeholder, style };
  });
}
