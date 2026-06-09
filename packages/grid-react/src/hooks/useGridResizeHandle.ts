import { useDraggable } from "@dnd-kit/react";
import type { ResizeHandleAxis } from "@snapgridjs/core";
import { NO_FEEDBACK, RESIZE_HANDLE_ATTR } from "@snapgridjs/dnd";
import { useSyncExternalStore } from "react";
import { useResolveController } from "./useResolveController.js";

export interface UseGridResizeHandleOptions {
  /** Matches the layout item's `i` — the item this handle resizes. */
  id: string;
  /** Which edge/corner this handle drives. */
  handle: ResizeHandleAxis;
  /** The owning grid's id, from its {@link useGridContainer}. */
  group: string;
}

export interface UseGridResizeHandleResult {
  /** Attach to your resize-handle element. */
  ref: (element: Element | null) => void;
  /** Spread onto the handle element so item drags ignore pointer-downs on it. */
  handleProps: { [RESIZE_HANDLE_ATTR]: true };
  /** True while this item is actively being resized. */
  isResizing: boolean;
}

/**
 * Headless hook for a single resize handle. Model a handle as its own draggable;
 * dragging it resizes the item from the given edge/corner. `group` is the owning
 * grid's id (from its {@link useGridContainer}). Spread `ref` and `handleProps`
 * onto the handle element you position/style.
 */
export function useGridResizeHandle({
  id,
  handle,
  group,
}: UseGridResizeHandleOptions): UseGridResizeHandleResult {
  const controller = useResolveController(group);
  const { ref } = useDraggable({
    id: `${id}::resize::${handle}`,
    disabled: !controller.config?.isItemResizable(id),
    plugins: NO_FEEDBACK,
    data: { snapGrid: { kind: "resize", itemId: id, handle, group } },
  });
  const { isResizing } = useSyncExternalStore(
    controller.subscribe,
    () => controller.resizeSnapshot(id),
    () => controller.resizeSnapshot(id),
  );
  return { ref, handleProps: { [RESIZE_HANDLE_ATTR]: true }, isResizing };
}
