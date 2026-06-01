import { useDroppable } from "@dnd-kit/react";
import { type GridConfig, bottom } from "@snapgridjs/core";
import { type CSSProperties, useCallback, useSyncExternalStore } from "react";
import { useGridRuntime } from "../context.js";

export interface GridContainerProps {
  /** Attach to your container element. */
  ref: (element: Element | null) => void;
  /** Positioning style (relative + width + auto-sized height). Spread onto your element. */
  style: CSSProperties;
  /** Present while a compatible draggable is over the grid. */
  "data-drop-target"?: true;
}

export interface UseGridContainerResult {
  /** Spread onto your container element. */
  containerProps: GridContainerProps;
  /** True while a compatible draggable is over the grid. */
  isDropTarget: boolean;
}

/** Total container height in pixels for the given number of occupied rows. */
function containerHeight(rows: number, grid: GridConfig): number {
  const padY = (grid.containerPadding ?? grid.margin)[1];
  if (rows <= 0) return padY * 2;
  return padY * 2 + rows * grid.rowHeight + (rows - 1) * grid.margin[1];
}

/**
 * Headless hook for the grid container. Registers the droppable surface (the
 * seam for cross-grid drops) and returns props (ref + sizing style) to spread
 * onto your own container element.
 */
export function useGridContainer(): UseGridContainerResult {
  const rt = useGridRuntime();
  const { ref, isDropTarget } = useDroppable({
    id: rt.containerId,
    type: "grid",
    // Accept grid tiles plus external draggables carrying a `snapGridDrop`
    // payload. The latter have no type, so `accept: "grid-item"` would reject
    // them and they'd never resolve as a drop target. (The provider still
    // decides whether to actually receive an external source via dropConfig.)
    accept: (source) => {
      if (source.type === "grid-item") return true;
      const data = source.data as { snapGridDrop?: unknown } | undefined;
      return data?.snapGridDrop != null;
    },
  });

  // Merge dnd-kit's droppable ref with reporting the element to the provider
  // (used to map the pointer to a cell when receiving a tile from another grid).
  const setContainerElement = rt.setContainerElement;
  const setRef = useCallback(
    (element: Element | null) => {
      ref(element);
      setContainerElement(element);
    },
    [ref, setContainerElement],
  );

  // Subscribe to the rendered layout (drag preview while dragging, else
  // committed) so the surface auto-height tracks the content as it reflows.
  const renderedLayout = useSyncExternalStore(
    rt.controller.subscribe,
    rt.controller.renderedSnapshot,
    rt.controller.renderedSnapshot,
  );
  const height = rt.autoSize ? containerHeight(bottom(renderedLayout), rt.gridConfig) : undefined;

  return {
    containerProps: {
      ref: setRef,
      style: { position: "relative", width: rt.width, height },
      "data-drop-target": isDropTarget || undefined,
    },
    isDropTarget,
  };
}
