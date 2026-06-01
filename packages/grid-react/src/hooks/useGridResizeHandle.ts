import { useDraggable } from "@dnd-kit/react";
import type { ResizeHandleAxis } from "@snapgridjs/core";
import { useSyncExternalStore } from "react";
import { useGridRuntime } from "../context.js";
import { NO_FEEDBACK, RESIZE_HANDLE_ATTR } from "./dndShared.js";

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
 * dragging it resizes the item from the given edge/corner. Position and style
 * the handle however you like — spread `ref` and `handleProps` onto it.
 */
export function useGridResizeHandle(
  itemId: string,
  handle: ResizeHandleAxis,
): UseGridResizeHandleResult {
  const rt = useGridRuntime();
  const { controller } = rt;
  const { ref } = useDraggable({
    id: `${itemId}::resize::${handle}`,
    disabled: !rt.isItemResizable(itemId),
    plugins: NO_FEEDBACK,
    data: { snapGrid: { kind: "resize", itemId, handle } },
  });
  const { isResizing } = useSyncExternalStore(
    controller.subscribe,
    () => controller.resizeSnapshot(itemId),
    () => controller.resizeSnapshot(itemId),
  );
  return { ref, handleProps: { [RESIZE_HANDLE_ATTR]: true }, isResizing };
}
