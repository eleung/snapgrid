import { useDraggable } from "@dnd-kit/vue";
import type { ResizeHandleAxis } from "@snapgridjs/core";
import { NO_FEEDBACK, RESIZE_HANDLE_ATTR } from "@snapgridjs/dnd";
import { type ComputedRef, computed, shallowRef } from "vue";
import { useGridContext } from "../context.js";
import { type RefTarget, toElement } from "../element.js";
import { controllerTick } from "../reactivity.js";

export interface UseGridResizeHandleOptions {
  /** Matches the layout item's `i` — the item this handle resizes. */
  id: string;
  /** Which edge/corner this handle drives. */
  handle: ResizeHandleAxis;
  /** The owning grid's id, from its {@link useGridContainer}. */
  group: string;
}

export interface GridResizeHandle {
  /** Function ref for the handle element: `<span :ref="handle.setRef">`. */
  setRef: (el: RefTarget) => void;
  /** Bind onto the handle element so item drags ignore pointer-downs on it. */
  handleProps: { [RESIZE_HANDLE_ATTR]: true };
  /** True while this item is actively being resized. */
  isResizing: ComputedRef<boolean>;
}

/**
 * Headless composable for a single resize handle. Model a handle as its own draggable;
 * dragging it resizes the item from the given edge/corner. `group` is the owning grid's
 * id (from its {@link useGridContainer}).
 *
 * Must be called during component setup, inside a grid container.
 */
export function useGridResizeHandle(opts: UseGridResizeHandleOptions): GridResizeHandle {
  const { id, handle, group } = opts;
  const { controller, version } = useGridContext(group);
  const tick = controllerTick(controller);

  const elRef = shallowRef<HTMLElement | null>(null);

  useDraggable({
    id: `${id}::resize::${handle}`,
    disabled: () => {
      version();
      return !controller.config?.isItemResizable(id);
    },
    // NO_FEEDBACK is a plain array (not the callback form), so it needs no getter wrap.
    plugins: NO_FEEDBACK,
    data: { snapGrid: { kind: "resize", itemId: id, handle, group } },
    element: elRef,
  });

  return {
    setRef: (el: RefTarget) => {
      elRef.value = toElement(el);
    },
    handleProps: { [RESIZE_HANDLE_ATTR]: true },
    isResizing: computed(() => {
      tick();
      return controller.resizeSnapshot(id).isResizing;
    }),
  };
}
