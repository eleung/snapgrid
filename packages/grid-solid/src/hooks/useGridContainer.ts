import { useDroppable } from "@dnd-kit/solid";
import { type GridConfig, bottom } from "@snapgridjs/core";
import {
  type GridController,
  SNAPGRID_GRID_ATTR,
  domElement,
  gridCollisionDetector,
} from "@snapgridjs/dnd";
import { type Accessor, type JSX, createMemo, createSignal, onCleanup } from "solid-js";
import { type UseGridControllerOptions, setupGridController } from "./useGridController.js";

export interface GridContainerResult {
  /**
   * Ref callback for your container element: `<div ref={container.ref}>`. Feeds the
   * droppable, reports the element to the controller, and stamps the nesting-depth marker.
   */
  ref: (el: HTMLElement) => void;
  /** Reactive inline style (position + width + auto-sized height). */
  style: Accessor<JSX.CSSProperties>;
  /** True while a compatible draggable is over the grid. */
  isDropTarget: Accessor<boolean>;
  /** This grid's id — pass as the `group` to tiles rendered inside. */
  group: Accessor<string>;
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
 * {@link useGridController}), registers the droppable surface, and returns a `ref`
 * callback plus a reactive style for your own container element. Render tiles inside via
 * {@link useGridItem}, passing `group` (this grid's id) so they resolve this controller.
 *
 * `getOpts` is a getter so the grid tracks your live state:
 * `useGridContainer(() => ({ width: width(), layout: layout(), onLayoutChange: setLayout }))`.
 *
 * Must be called in a component rendered INSIDE a `<DragDropProvider>` (supplied by
 * `<GridLayout>` / `<SnapGridGroup>` for the turnkey case) — Solid resolves context from
 * the owner chain, so a component that renders the provider itself cannot see its manager.
 */
export function useGridContainer(getOpts: () => UseGridControllerOptions): GridContainerResult {
  const { controller, version, tick, id } = setupGridController(getOpts);

  // The container element, tracked for the ancestry guard (reject dropping a host tile
  // into the nested grid it contains).
  const [element, setElement] = createSignal<HTMLElement | null>(null);

  // Reject a source whose element CONTAINS this grid — an ancestor tile that hosts this
  // nested grid — so a host tile can't be dropped into the grid it contains now that
  // nested grids share one manager.
  const accept = (source: Parameters<typeof domElement>[0] & { data?: unknown }): boolean => {
    const srcEl = domElement(source);
    const gridEl = element();
    if (srcEl && gridEl && srcEl.contains(gridEl)) return false;
    const data = source.data as { snapGrid?: unknown; snapGridDrop?: unknown } | undefined;
    // A grid tile is identified by its `snapGrid` payload, not its `type`.
    if (data?.snapGrid != null) return true;
    if (data?.snapGridDrop != null) return true;
    // Consumer extension: accept foreign dnd-kit draggables for interop; the receive is
    // driven via snapMove.
    return getOpts().accept?.(source as never) ?? false;
  };

  // Only notifies when the type actually changes, though it re-evaluates on any option.
  const type = createMemo(() => getOpts().type ?? "grid");

  // dnd-kit's Solid adapter reads each input property inside an effect, so getters make
  // `id` / `type` reactive.
  const droppable = useDroppable({
    get id() {
      return id();
    },
    get type() {
      return type();
    },
    accept,
    collisionDetector: gridCollisionDetector,
  });

  // Solid calls a ref once, when the element is created, so the side effects can live
  // here directly. It never calls it with `null` on teardown — the cleanup does that.
  const ref = (el: HTMLElement): void => {
    setElement(el);
    droppable.ref(el);
    // The engine reads the element to map the pointer to a cell when receiving a tile;
    // the marker lets nested grids measure their depth.
    controller.element = el;
    el.setAttribute(SNAPGRID_GRID_ATTR, "");
  };
  onCleanup(() => {
    if (controller.element === element()) controller.element = null;
  });

  // Auto-height tracks the rendered layout (drag preview while dragging, else committed)
  // so the surface grows/shrinks as the grid reflows. Depends on both the drag tick
  // (preview changes) and the republish tick (width/config changes).
  const style = createMemo((): JSX.CSSProperties => {
    version();
    tick();
    const config = controller.config;
    if (!config) return { position: "relative" };
    const style: JSX.CSSProperties = { position: "relative", width: `${config.width}px` };
    if (config.autoSize) {
      const rendered = controller.renderedSnapshot();
      style.height = `${containerHeight(bottom(rendered), config.gridConfig)}px`;
    }
    return style;
  });

  return {
    ref,
    style,
    isDropTarget: () => droppable.isDropTarget() === true,
    group: id,
    controller,
  };
}
