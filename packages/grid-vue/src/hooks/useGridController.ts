import { useDragDropManager } from "@dnd-kit/vue";
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
import { shallowRef, useId, watchEffect } from "vue";
import { provideGridContext } from "../context.js";

const DEFAULT_HANDLES = ["se"] as const;

// Fallback when `useId()` is unavailable (a composable called outside a component
// instance, e.g. a bare effect scope in a test).
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

/** Options the grid host ({@link useGridContainer}) feeds the controller. */
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
  /** Container width in pixels (e.g. from {@link useContainerWidth}). */
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
   * `useSortable` card from a sibling list, for interop. Extends the built-in
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

/** Internal: the controller plus the republish tick the container needs directly. */
export interface GridControllerSeam {
  controller: GridController;
  version: () => number;
}

/**
 * The grid's Vue seam: owns the {@link GridController} (an observable render bridge),
 * publishes per-grid config to it reactively, registers it for id → controller
 * resolution, and attaches the manager-wide engine.
 *
 * `getOpts` is a getter so the controller stays reactive to the consumer's live state
 * (width, layout, config): reading it inside the publish `watchEffect` tracks
 * whichever fields change. `watchEffect` runs its first pass synchronously during
 * setup — before child tiles set up — so they read fresh geometry on their first pass
 * (the Vue analog of the React binding writing config during render).
 *
 * Consumes the ambient dnd-kit `DragDropProvider`; it does not mint one. Must be
 * called during component setup, in a CHILD of the provider (Vue resolves `inject`
 * from the parent chain).
 */
export function setupGridController(getOpts: () => UseGridControllerOptions): GridControllerSeam {
  const manager = useDragDropManager();
  const first = getOpts();
  const autoId = useId();
  const initialId = first.id ?? (autoId ? `snapgrid-${autoId}` : nextGridId());

  // Built directly rather than via dnd-kit's `useInstance`: that helper feeds
  // `register()`'s return value to `onWatcherCleanup`, and `GridController.register`
  // is a deliberate no-op returning `undefined`, which makes Vue log an "Invalid value
  // type passed to callWithAsyncErrorHandling" warning on every teardown. The helper
  // would only set `.manager` and call that no-op, both of which we do here.
  const controller = new GridController(initialId, first.layout, manager.value);

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

  // Item sensors read the live drag config; rebuilt only when the distance threshold
  // changes (it's captured by value), mirroring the React memo.
  let builtThreshold = first.dragConfig?.threshold ?? 3;
  let itemSensors = buildItemSensors(builtThreshold, () => latestOpts.dragConfig);

  // Reactive tick the container bumps on every republish, so tiles re-read geometry
  // after a width/layout/config change (the controller's own `subscribe` only fires
  // on drag-state changes).
  const version = shallowRef(0);
  let versionCount = 0;

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
    // Bump the republish tick with a bare WRITE: `publish` runs inside a
    // `watchEffect`, and `version.value++` would read+write the same ref, making the
    // effect depend on itself and loop. Assigning from a plain counter only triggers.
    version.value = ++versionCount;
  }

  // Register synchronously during setup so child tiles (and `resolveController`)
  // resolve this controller on their first setup — children set up after the parent's
  // setup body runs. The effect below owns cleanup + id changes.
  registerController(manager.value, initialId, controller);

  // Keep the registry key in sync with a changing `id`, and unregister on teardown.
  watchEffect((onCleanup) => {
    const id = getOpts().id ?? initialId;
    if (controller.id !== id) controller.setId(id);
    onCleanup(registerController(manager.value, id, controller));
  });

  // Republish per-grid config whenever the consumer's reactive options change. The
  // first pass runs synchronously here, publishing the initial config before children
  // set up.
  watchEffect(() => {
    publish(getOpts());
  });

  // Attach the manager-wide drag/resize engine (ref-counted; one per manager, shared
  // by every grid on it). Detaches when the last grid unmounts.
  watchEffect((onCleanup) => {
    controller.manager = manager.value;
    // Vue runs `watchEffect` bodies once during SSR (that's what puts engine-computed
    // geometry in the server HTML two effects up). There are no drags on the server, so
    // skip building the engine and its monitor listeners on every server render — and
    // its refcount, which no cleanup would ever decrement there.
    if (typeof window === "undefined") return;
    onCleanup(attachEngine(manager.value));
  });

  const versionGetter = () => version.value;
  provideGridContext({ controller, version: versionGetter });
  return { controller, version: versionGetter };
}

/**
 * Create and own a grid's {@link GridController} without rendering a surface — the
 * advanced seam under {@link useGridContainer}. Most consumers want
 * `useGridContainer` instead.
 */
export function useGridController(getOpts: () => UseGridControllerOptions): GridController {
  return setupGridController(getOpts).controller;
}
