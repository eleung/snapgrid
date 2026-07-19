import { createDraggable } from "@dnd-kit/svelte";
import type { ResizeHandleAxis } from "@snapgridjs/core";
import { NO_FEEDBACK, RESIZE_HANDLE_ATTR } from "@snapgridjs/dnd";
import { getGridContext } from "../context.js";
import { controllerTick } from "../reactivity.svelte.js";

export interface UseGridResizeHandleOptions {
  /** Matches the layout item's `i` — the item this handle resizes. */
  id: string;
  /** Which edge/corner this handle drives. */
  handle: ResizeHandleAxis;
  /** The owning grid's id, from its {@link createGridContainer}. */
  group: string;
}

export interface GridResizeHandle {
  /** Svelte attachment for the handle element: `<span {@attach handle.attach}>`. */
  attach: (node: HTMLElement) => () => void;
  /** Spread onto the handle element so item drags ignore pointer-downs on it. */
  handleProps: { [RESIZE_HANDLE_ATTR]: true };
  /** True while this item is actively being resized. */
  readonly isResizing: boolean;
}

/**
 * Headless factory for a single resize handle. Model a handle as its own draggable;
 * dragging it resizes the item from the given edge/corner. `group` is the owning
 * grid's id (from its {@link createGridContainer}).
 *
 * Must be called during component initialization, inside a grid container.
 */
export function createGridResizeHandle(opts: UseGridResizeHandleOptions): GridResizeHandle {
  const { id, handle, group } = opts;
  const { controller, version } = getGridContext(group);
  const tick = controllerTick(controller);

  const draggable = createDraggable({
    get id() {
      return `${id}::resize::${handle}`;
    },
    get disabled() {
      version();
      return !controller.config?.isItemResizable(id);
    },
    plugins: NO_FEEDBACK,
    data: { snapGrid: { kind: "resize", itemId: id, handle, group } },
  });

  const isResizing = $derived.by(() => {
    tick();
    return controller.resizeSnapshot(id).isResizing;
  });

  return {
    attach: (node: HTMLElement) => draggable.attach(node),
    handleProps: { [RESIZE_HANDLE_ATTR]: true },
    get isResizing() {
      return isResizing;
    },
  };
}
