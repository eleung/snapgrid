import { useDroppable } from "@dnd-kit/vue";
import { type GridConfig, bottom } from "@snapgridjs/core";
import {
  type GridController,
  SNAPGRID_GRID_ATTR,
  domElement,
  gridCollisionDetector,
} from "@snapgridjs/dnd";
import { type ComputedRef, computed, shallowRef, watch } from "vue";
import { type RefTarget, toElement } from "../element.js";
import { controllerTick } from "../reactivity.js";
import { type UseGridControllerOptions, setupGridController } from "./useGridController.js";

export interface GridContainerResult {
  /**
   * Function ref for your container element: `<div :ref="container.setRef">`.
   * Feeds the droppable, reports the element to the controller, and stamps the
   * nesting-depth marker.
   */
  setRef: (el: RefTarget) => void;
  /** Reactive inline-style string (position + width + auto-sized height). */
  style: ComputedRef<string>;
  /** True while a compatible draggable is over the grid. */
  isDropTarget: ComputedRef<boolean>;
  /** This grid's id — pass as the `group` to tiles rendered inside. */
  group: ComputedRef<string>;
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
 * The grid host: creates this grid's controller + drag engine (see
 * {@link useGridController}), registers the droppable surface, and returns a `setRef`
 * function ref plus a reactive style for your own container element. Render tiles
 * inside via {@link useGridItem}, passing `group` (this grid's id) so they resolve
 * this controller.
 *
 * Must be called during component setup, in a CHILD component of a
 * `<DragDropProvider>` (supplied by `<GridLayout>` / `<SnapGridGroup>` for the
 * turnkey case) — Vue resolves `inject` from the parent chain, so a component that
 * renders the provider itself cannot see its manager.
 */
export function useGridContainer(getOpts: () => UseGridControllerOptions): GridContainerResult {
  const { controller, version } = setupGridController(getOpts);
  const tick = controllerTick(controller);

  // The container element: fed to the droppable, and tracked for the ancestry guard
  // (reject dropping a host tile into the nested grid it contains).
  const elRef = shallowRef<HTMLElement | null>(null);

  // Reject a source whose element CONTAINS this grid — an ancestor tile that hosts
  // this nested grid — so a host tile can't be dropped into the grid it contains now
  // that nested grids share one manager.
  const accept = (source: Parameters<typeof domElement>[0] & { data?: unknown }): boolean => {
    const srcEl = domElement(source);
    const gridEl = elRef.value;
    if (srcEl && gridEl && srcEl.contains(gridEl)) return false;
    const data = source.data as { snapGrid?: unknown; snapGridDrop?: unknown } | undefined;
    // A grid tile is identified by its `snapGrid` payload, not its `type`.
    if (data?.snapGrid != null) return true;
    if (data?.snapGridDrop != null) return true;
    // Consumer extension: accept foreign dnd-kit draggables for interop; the receive
    // is driven via snapMove.
    return getOpts().accept?.(source as never) ?? false;
  };

  const dropHandle = useDroppable({
    id: () => {
      version();
      return controller.id;
    },
    type: () => getOpts().type ?? "grid",
    // `accept` and `collisionDetector` are themselves FUNCTIONS, and dnd-kit's Vue
    // adapter resolves every input with `toValue()` — which invokes a bare function as
    // a getter. Wrap them so `toValue` yields the function instead of calling it.
    accept: () => accept,
    collisionDetector: () => gridCollisionDetector,
    element: elRef,
  });

  // Vue invokes a function ref on EVERY patch, not just when the element changes, so
  // this stays a pure assignment and the side effects below key off element identity
  // (writing the same node to a shallowRef doesn't trigger).
  const setRef = (el: RefTarget): void => {
    elRef.value = toElement(el);
  };

  // Report the element to the controller (the engine reads it to map the pointer to a
  // cell when receiving a tile) and stamp the grid marker so nested grids can measure
  // their depth.
  watch(
    elRef,
    (node, prev) => {
      if (prev && controller.element === prev) controller.element = null;
      if (node) {
        controller.element = node;
        node.setAttribute(SNAPGRID_GRID_ATTR, "");
      }
    },
    { flush: "post" },
  );

  // Auto-height tracks the rendered layout (drag preview while dragging, else
  // committed) so the surface grows/shrinks as the grid reflows. Depends on both the
  // drag tick (preview changes) and the republish tick (width/config changes).
  const style = computed(() => {
    version();
    tick();
    const config = controller.config;
    if (!config) return "position: relative;";
    const rendered = controller.renderedSnapshot();
    const height = config.autoSize
      ? containerHeight(bottom(rendered), config.gridConfig)
      : undefined;
    return `position: relative; width: ${config.width}px;${height != null ? ` height: ${height}px;` : ""}`;
  });

  return {
    setRef,
    style,
    isDropTarget: computed(() => dropHandle.isDropTarget.value === true),
    group: computed(() => {
      version();
      return controller.id;
    }),
    controller,
  };
}
