import { useDroppable } from "@dnd-kit/react";
import { type GridConfig, bottom } from "@snapgridjs/core";
import {
  type GridController,
  SNAPGRID_GRID_ATTR,
  domElement,
  gridCollisionDetector,
} from "@snapgridjs/dnd";
import { type CSSProperties, useCallback, useRef, useSyncExternalStore } from "react";
import { type UseGridControllerOptions, useGridController } from "./useGridController.js";

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
  /** This grid's id — pass as the `group` to {@link useGridItem} for its tiles. */
  group: string;
  /** The grid's controller (for advanced/headless composition). */
  controller: GridController;
}

/** Total container height in pixels for the given number of occupied rows. */
function containerHeight(rows: number, grid: GridConfig): number {
  const padY = (grid.containerPadding ?? grid.margin)[1];
  if (rows <= 0) return padY * 2;
  return padY * 2 + rows * grid.rowHeight + (rows - 1) * grid.margin[1];
}

/**
 * The grid host: creates this grid's controller + drag monitor (see
 * {@link useGridController}), registers the droppable surface, and returns props
 * to spread onto your own container element. Render `useGridItem` tiles inside,
 * passing `group` (this grid's id) so they resolve this controller.
 */
export function useGridContainer(opts: UseGridControllerOptions): UseGridContainerResult {
  const controller = useGridController(opts);
  const config = controller.config;
  const { width, autoSize, gridConfig } = config!;
  const gridElRef = useRef<Element | null>(null);

  const { ref, isDropTarget } = useDroppable({
    id: controller.id,
    type: "grid",
    // Accept grid tiles plus external draggables carrying a `snapGridDrop`
    // payload. The latter have no type, so `accept: "grid-item"` would reject
    // them and they'd never resolve as a drop target. (The provider still
    // decides whether to actually receive an external source via dropConfig.)
    accept: (source) => {
      // Reject a source whose element CONTAINS this grid — an ancestor tile that
      // hosts this nested grid. Prevents dropping a host tile into the grid it
      // contains (a paradox) now that nested grids can share one manager.
      const srcEl = domElement(source);
      if (srcEl && gridElRef.current && srcEl.contains(gridElRef.current)) return false;
      if (source.type === "grid-item") return true;
      const data = source.data as { snapGridDrop?: unknown } | undefined;
      if (data?.snapGridDrop != null) return true;
      // Consumer extension: accept foreign dnd-kit draggables (e.g. a sortable
      // card) as drop targets for interop; the receive is driven via snapMove.
      return opts.accept?.(source) ?? false;
    },
    collisionDetector: gridCollisionDetector,
  });

  // Merge dnd-kit's droppable ref with reporting the element to the controller
  // (the engine reads it to map the pointer to a cell when receiving a tile from
  // another grid), and mark the element so nested grids can measure their depth.
  const setRef = useCallback(
    (element: Element | null) => {
      ref(element);
      controller.element = element;
      gridElRef.current = element;
      if (element) element.setAttribute(SNAPGRID_GRID_ATTR, "");
    },
    [ref, controller],
  );

  // Subscribe to the rendered layout (drag preview while dragging, else
  // committed) so the surface auto-height tracks the content as it reflows.
  const renderedLayout = useSyncExternalStore(
    controller.subscribe,
    controller.renderedSnapshot,
    controller.renderedSnapshot,
  );
  const height = autoSize ? containerHeight(bottom(renderedLayout), gridConfig) : undefined;

  return {
    containerProps: {
      ref: setRef,
      style: { position: "relative", width, height },
      "data-drop-target": isDropTarget || undefined,
    },
    isDropTarget,
    group: controller.id,
    controller,
  };
}
