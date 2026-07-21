import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { getGridContext } from "../context.js";
import { controllerTick } from "../reactivity.svelte.js";

export interface GridPlaceholderInfo {
  /** The layout entry marking where the dragged item will land. */
  item: LayoutItem;
  /** Positioning inline-style string (left/top/size) for your placeholder element. */
  style: string;
}

export interface GridPlaceholderHandle {
  /** The placeholder to render, or `null` when no drag is in progress. */
  readonly current: GridPlaceholderInfo | null;
}

/**
 * Headless factory returning where the drag placeholder should be rendered, or
 * `null` when no drag is in progress. `group` is the owning grid's id (from its
 * {@link createGridContainer}). Render the element however you like.
 *
 * Must be called during component initialization, inside a grid container.
 */
export function createGridPlaceholder(group: string): GridPlaceholderHandle {
  const { controller, version } = getGridContext(group);
  const tick = controllerTick(controller);

  const current = $derived.by((): GridPlaceholderInfo | null => {
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
    const style = `position: absolute; left: 0; top: 0; width: ${pos.width}px; height: ${pos.height}px; transform: translate(${pos.left}px, ${pos.top}px); pointer-events: none;`;
    return { item: placeholder, style };
  });

  return {
    get current() {
      return current;
    },
  };
}
