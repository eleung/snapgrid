import { createInstance, getDragDropManager } from "@dnd-kit/svelte";
import {
  type Compactor,
  type GridConfig,
  type Layout,
  type LayoutItem,
  type PositionParams,
  defaultGridConfig,
  toPositionParams,
  verticalCompactor,
} from "@snapgridjs/core";
import {
  type DragConfig,
  type DragSourceInfo,
  type DropConfig,
  GridController,
  type GridEventCallback,
  type ResizeConfig,
  SnapToGrid,
  attachEngine,
  buildItemSensors,
  registerController,
} from "@snapgridjs/dnd";
import { untrack } from "svelte";
import { setGridContext } from "../context.js";

const DEFAULT_HANDLES = ["se"] as const;

// Stable per-instance fallback id when the consumer doesn't supply one. Svelte has
// no `useId`; a module counter is assigned once per controller (stable across the
// instance's life) and, because components initialize in a deterministic order,
// stays consistent between server and client render.
let gridIdCounter = 0;
function nextGridId(): string {
  return `snapgrid-${gridIdCounter++}`;
}

// Per-item drag/resize gate. Mirrors RGL's engine rule: a `static` item is locked
// unless its flag (`isDraggable`/`isResizable`) is explicitly `true` ("pinned");
// a non-static item just follows the flag (default `true`).
function itemGateOpen(flag: boolean | undefined, isStatic: boolean | undefined): boolean {
  return isStatic ? flag === true : (flag ?? true);
}

/** Options the grid host ({@link createGridContainer}) feeds the controller. */
export interface UseGridControllerOptions {
  /** Stable id for the grid's droppable surface (auto-generated if omitted). */
  id?: string;
  /**
   * The dnd-kit `type` the grid's droppable surface carries. Defaults to `"grid"`.
   * Override to namespace grids for ecosystem interop — e.g. so a foreign draggable
   * `accept`s only one grid, or you branch `onDragOver` on a specific grid type.
   * Nothing internal depends on this string (grids resolve by id), so any value
   * still receives tiles and cross-grid drops.
   */
  type?: string;
  /** Container width in pixels (e.g. from {@link createContainerWidth}). */
  width: number;
  /** Controlled layout. Never mutated. */
  layout: Layout;
  onLayoutChange?: (layout: Layout) => void;
  gridConfig?: Partial<GridConfig>;
  dragConfig?: DragConfig;
  resizeConfig?: ResizeConfig;
  dropConfig?: DropConfig;
  /**
   * Accept additional (non-grid) dnd-kit draggables as drop targets — e.g. a
   * `createSortable` card from a sibling list, for interop. Extends the built-in
   * acceptance (grid tiles + `snapGridDrop` externals); the ancestry guard still
   * applies. You drive the actual receive in your own `onDragOver` with `snapMove`.
   */
  accept?: (source: DragSourceInfo) => boolean;
  compactor?: Compactor;
  isDraggable?: boolean;
  isResizable?: boolean;
  autoSize?: boolean;
  onDragStart?: GridEventCallback;
  onDrag?: GridEventCallback;
  onDragStop?: GridEventCallback;
  onResizeStart?: GridEventCallback;
  onResize?: GridEventCallback;
  onResizeStop?: GridEventCallback;
  onDrop?: (layout: Layout, item: LayoutItem, event: Event | null) => void;
}

/**
 * The grid's Svelte seam: owns the {@link GridController} (an observable render
 * bridge), publishes per-grid config to it reactively, registers it for id →
 * controller resolution, and attaches the manager-wide engine.
 *
 * `getOpts` is a getter so the controller stays reactive to the consumer's live
 * state (width, layout, config): reading it inside the publish `$effect` tracks
 * whichever fields change. The initial config is published synchronously during
 * component init — before child tiles initialize — so they read fresh geometry on
 * their first pass (the Svelte analog of the React binding writing config during
 * render). Consumes the ambient dnd-kit `DragDropProvider`; it does not mint one.
 *
 * Must be called during component initialization.
 */
export function createGridController(getOpts: () => UseGridControllerOptions): GridController {
  const manager = getDragDropManager();
  const first = getOpts();
  const initialId = first.id ?? nextGridId();

  const controller = createInstance<GridController>(
    (m) => new GridController(initialId, first.layout, m),
  );

  // Live snapshots the once-built sensor/modifier descriptors read lazily, so the
  // descriptors stay identity-stable while still seeing the latest config.
  let latestOpts = first;
  let latestPositionParams: PositionParams = toPositionParams(
    { ...defaultGridConfig, ...first.gridConfig },
    first.width,
  );

  // Snap-to-grid modifier: a stable descriptor reading live refs (a no-op unless
  // `dragConfig.snapToGrid` is set).
  const itemModifiers = [
    SnapToGrid.configure({
      getPositionParams: () => latestPositionParams,
      isEnabled: () => latestOpts.dragConfig?.snapToGrid ?? false,
    }),
  ];

  // Item sensors read the live drag config; rebuilt only when the distance
  // threshold changes (it's captured by value), mirroring the React memo.
  let builtThreshold = first.dragConfig?.threshold ?? 3;
  let itemSensors = buildItemSensors(builtThreshold, () => latestOpts.dragConfig);

  // Reactive tick the container bumps on every republish, so tiles re-read geometry
  // after a width/layout/config change (the controller's own `subscribe` only fires
  // on drag-state changes).
  let version = $state(0);

  function publish(opts: UseGridControllerOptions): void {
    latestOpts = opts;
    const id = opts.id ?? initialId;
    if (controller.id !== id) controller.setId(id);

    const gridConfig: GridConfig = { ...defaultGridConfig, ...opts.gridConfig };
    const positionParams = toPositionParams(gridConfig, opts.width);
    latestPositionParams = positionParams;
    const compactor: Compactor = opts.compactor ?? verticalCompactor;

    controller.setCommitted(opts.layout);

    const threshold = opts.dragConfig?.threshold ?? 3;
    if (threshold !== builtThreshold) {
      builtThreshold = threshold;
      itemSensors = buildItemSensors(threshold, () => latestOpts.dragConfig);
    }

    const committedById = new Map<string, LayoutItem>(opts.layout.map((it) => [it.i, it]));

    const gridDraggable = opts.isDraggable ?? true;
    const dragEnabled = opts.dragConfig?.enabled ?? true;
    const isItemDraggable = (itemId: string): boolean => {
      const it = committedById.get(itemId);
      if (!it) return false;
      return gridDraggable && dragEnabled && itemGateOpen(it.isDraggable, it.static);
    };

    const gridResizable = opts.isResizable ?? true;
    const resizeEnabled = opts.resizeConfig?.enabled ?? true;
    const isItemResizable = (itemId: string): boolean => {
      const it = committedById.get(itemId);
      if (!it) return false;
      return gridResizable && resizeEnabled && itemGateOpen(it.isResizable, it.static);
    };

    const defaultHandles = opts.resizeConfig?.handles;
    const resizeHandlesFor = (itemId: string) =>
      committedById.get(itemId)?.resizeHandles ?? defaultHandles ?? DEFAULT_HANDLES;

    controller.setConfig({
      positionParams,
      gridConfig,
      width: opts.width,
      autoSize: opts.autoSize ?? true,
      itemSensors,
      itemModifiers,
      isItemDraggable,
      isItemResizable,
      resizeHandlesFor,
      compactor,
      dragConfig: opts.dragConfig,
      dropConfig: opts.dropConfig,
      callbacks: {
        onDragStart: opts.onDragStart,
        onDrag: opts.onDrag,
        onDragStop: opts.onDragStop,
        onResizeStart: opts.onResizeStart,
        onResize: opts.onResize,
        onResizeStop: opts.onResizeStop,
        onLayoutChange: opts.onLayoutChange,
        onDrop: opts.onDrop,
      },
    });
    // Bump the republish tick WITHOUT tracking the read: `publish` runs inside an
    // `$effect`, and a tracked `version++` would read+write the same state and loop.
    // The write still notifies items/containers that read `version`.
    untrack(() => {
      version += 1;
    });
  }

  // Register synchronously during init so child tiles (and `resolveController`)
  // resolve this controller on their first init — children initialize after the
  // parent's script body runs. The effect below owns cleanup + id changes.
  registerController(manager, initialId, controller);
  // Publish the initial config synchronously so children read fresh config on init.
  publish(first);

  // Keep the registry key in sync with a changing `id`, and unregister on destroy.
  $effect(() => {
    const id = getOpts().id ?? initialId;
    if (controller.id !== id) controller.setId(id);
    return registerController(manager, id, controller);
  });

  // Republish per-grid config whenever the consumer's reactive options change.
  $effect(() => {
    publish(getOpts());
  });

  // Attach the manager-wide drag/resize engine (ref-counted; one per manager,
  // shared by every grid on it). Detaches when the last grid unmounts.
  $effect(() => attachEngine(manager));

  setGridContext({ controller, version: () => version });
  return controller;
}
