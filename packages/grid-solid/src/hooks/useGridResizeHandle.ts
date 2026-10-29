import { useDraggable } from "@dnd-kit/solid";
import type { ResizeHandleAxis } from "@snapgridjs/core";
import { NO_FEEDBACK, RESIZE_HANDLE_ATTR } from "@snapgridjs/dnd";
import { type Accessor, createMemo } from "solid-js";
import { useGridContext } from "../context.js";

export interface UseGridResizeHandleOptions {
  /** Matches the layout item's `i` — the item this handle resizes. */
  id: string;
  /** Which edge/corner this handle drives. */
  handle: ResizeHandleAxis;
  /** The owning grid's id, from its {@link useGridContainer}. */
  group: string;
}

export interface GridResizeHandle {
  /** Ref callback for the handle element: `<span ref={handle.ref}>`. */
  ref: (el: HTMLElement) => void;
  /** Spread onto the handle element so item drags ignore pointer-downs on it. */
  handleProps: { [RESIZE_HANDLE_ATTR]: true };
  /** True while this item is actively being resized. */
  isResizing: Accessor<boolean>;
}

/**
 * Headless hook for a single resize handle. Model a handle as its own draggable;
 * dragging it resizes the item from the given edge/corner. `group` is the owning grid's
 * id (from its {@link useGridContainer}).
 *
 * Must be called in a component rendered inside a grid container.
 */
export function useGridResizeHandle(opts: UseGridResizeHandleOptions): GridResizeHandle {
  const { id, handle, group } = opts;
  const { controller, version, tick } = useGridContext(group);

  const disabled = createMemo(() => {
    version();
    return !controller.config?.isItemResizable(id);
  });

  const draggable = useDraggable({
    id: `${id}::resize::${handle}`,
    get disabled() {
      return disabled();
    },
    plugins: NO_FEEDBACK,
    data: { snapGrid: { kind: "resize", itemId: id, handle, group } },
  });

  return {
    ref: (el: HTMLElement) => draggable.ref(el),
    handleProps: { [RESIZE_HANDLE_ATTR]: true },
    // A plain accessor, not a memo: most handles (the default one included) never read
    // it, and a memo would recompute on every drag emit regardless.
    isResizing: () => {
      tick();
      return controller.resizeSnapshot(id).isResizing;
    },
  };
}
