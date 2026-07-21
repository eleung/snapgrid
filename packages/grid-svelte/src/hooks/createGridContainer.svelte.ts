import { createDroppable } from "@dnd-kit/svelte";
import { type GridConfig, bottom } from "@snapgridjs/core";
import {
  type GridController,
  SNAPGRID_GRID_ATTR,
  domElement,
  gridCollisionDetector,
} from "@snapgridjs/dnd";
import { getGridContext } from "../context.js";
import { controllerTick } from "../reactivity.svelte.js";
import {
  type UseGridControllerOptions,
  createGridController,
} from "./createGridController.svelte.js";

export interface GridContainerResult {
  /**
   * Svelte attachment for your container element:
   * `<div {@attach container.attach} style={container.style}>`.
   */
  attach: (node: HTMLElement) => () => void;
  /** Reactive inline-style string (position + width + auto-sized height). */
  readonly style: string;
  /** True while a compatible draggable is over the grid. */
  readonly isDropTarget: boolean;
  /** This grid's id — pass as the `group` to tiles rendered inside. */
  readonly group: string;
  /** The grid's controller (for advanced/headless composition). */
  readonly controller: GridController;
}

/** Total container height in pixels for the given number of occupied rows. */
function containerHeight(rows: number, grid: GridConfig): number {
  const padY = (grid.containerPadding ?? grid.margin)[1];
  if (rows <= 0) return padY * 2;
  return padY * 2 + rows * grid.rowHeight + (rows - 1) * grid.margin[1];
}

/**
 * The grid host: creates this grid's controller + drag engine (see
 * {@link createGridController}), registers the droppable surface, and returns an
 * `attach` attachment + reactive style for your own container element. Render tiles
 * inside via {@link createGridItem}, passing `group` (this grid's id) so they
 * resolve this controller.
 *
 * Must be called during component initialization, inside a `<DragDropProvider>`
 * (supplied by `<GridLayout>` / `<SnapGridGroup>` for the turnkey case).
 */
export function createGridContainer(getOpts: () => UseGridControllerOptions): GridContainerResult {
  const controller = createGridController(getOpts);
  // Read back the reactive republish tick the controller published to context, so
  // the droppable id and the auto-height recompute when config/id changes.
  const { version } = getGridContext();
  const tick = controllerTick(controller);

  // The container element, tracked for the ancestry guard (reject dropping a host
  // tile into the nested grid it contains).
  let gridEl: Element | null = null;

  // Keep the handle intact — never destructure it; its `isDropTarget` is a
  // reactive getter that would go stale if read once at destructure time.
  const dropHandle = createDroppable({
    get id() {
      version();
      return controller.id;
    },
    get type() {
      return getOpts().type ?? "grid";
    },
    // Accept grid tiles plus external draggables carrying a `snapGridDrop` payload.
    // (dropConfig still decides whether an external source is actually received.)
    accept: (source) => {
      // Reject a source whose element CONTAINS this grid — an ancestor tile that
      // hosts this nested grid — so a host tile can't be dropped into the grid it
      // contains now that nested grids share one manager.
      const srcEl = domElement(source);
      if (srcEl && gridEl && srcEl.contains(gridEl)) return false;
      const data = source.data as { snapGrid?: unknown; snapGridDrop?: unknown } | undefined;
      // A grid tile is identified by its `snapGrid` payload, not its `type`.
      if (data?.snapGrid != null) return true;
      if (data?.snapGridDrop != null) return true;
      // Consumer extension: accept foreign dnd-kit draggables for interop; the
      // receive is driven via snapMove.
      return getOpts().accept?.(source) ?? false;
    },
    collisionDetector: gridCollisionDetector,
  });

  // Merge dnd-kit's droppable attachment with reporting the element to the
  // controller (the engine reads it to map the pointer to a cell when receiving a
  // tile) and stamping the grid marker so nested grids can measure their depth.
  const attach = (node: HTMLElement): (() => void) => {
    const cleanup = dropHandle.attach(node);
    controller.element = node;
    gridEl = node;
    node.setAttribute(SNAPGRID_GRID_ATTR, "");
    return () => {
      cleanup?.();
      if (controller.element === node) controller.element = null;
      if (gridEl === node) gridEl = null;
    };
  };

  // Auto-height tracks the rendered layout (drag preview while dragging, else
  // committed) so the surface grows/shrinks as the grid reflows. Depends on both
  // the drag tick (preview changes) and the republish tick (width/config changes).
  const style = $derived.by(() => {
    version();
    tick();
    const config = controller.config!;
    const rendered = controller.renderedSnapshot();
    const height = config.autoSize
      ? containerHeight(bottom(rendered), config.gridConfig)
      : undefined;
    return `position: relative; width: ${config.width}px;${height != null ? ` height: ${height}px;` : ""}`;
  });

  return {
    attach,
    get style() {
      return style;
    },
    get isDropTarget() {
      return dropHandle.isDropTarget;
    },
    get group() {
      version();
      return controller.id;
    },
    get controller() {
      return controller;
    },
  };
}
