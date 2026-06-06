import { useDragDropManager, useInstance } from "@dnd-kit/react";
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
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

const DEFAULT_HANDLES = ["se"] as const;

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

/**
 * The grid's React seam: owns the {@link GridController} (an observable render
 * bridge), publishes per-grid config to it each render, registers it for id →
 * controller resolution, and attaches the manager-wide {@link SnapGridEngine}.
 *
 * The drag/resize *orchestration* lives in the engine (one per manager), not
 * here — this hook only wires the React-specific parts: the controller, the item
 * sensors/modifiers descriptors, the draggable/resizable gates, and the config
 * the engine reads. Created by {@link useGridContainer}; items resolve the same
 * controller by their `group` (= this grid's id). Consumes the ambient
 * `DragDropProvider` — it does not mint one.
 */
export function useGridController(opts: UseGridControllerOptions): GridController {
  const autoId = useId();
  const containerId = opts.id ?? autoId;

  const gridConfig: GridConfig = useMemo(
    () => ({ ...defaultGridConfig, ...opts.gridConfig }),
    [opts.gridConfig],
  );
  const positionParams: PositionParams = useMemo(
    () => toPositionParams(gridConfig, opts.width),
    [gridConfig, opts.width],
  );
  const compactor: Compactor = opts.compactor ?? verticalCompactor;

  const manager = useDragDropManager();
  const controller = useInstance<GridController>(
    (m) => new GridController(containerId, opts.layout, m ?? undefined),
  );
  controller.setCommitted(opts.layout);
  // useInstance creates the controller once, freezing its id to the first render's
  // value; re-point it if the controlled `id` prop changes so the group, the
  // droppable id, and the registry key (below) stay in sync. (Read during render,
  // before useGridContainer's droppable/group read controller.id.)
  if (controller.id !== containerId) controller.setId(containerId);

  // Live refs for the item sensor/modifier descriptors, which read config lazily
  // (they're built once but must see the latest dragConfig / positionParams).
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const ppRef = useRef(positionParams);
  ppRef.current = positionParams;

  // Register the controller so items (and snapMove) resolve it by id, and so the
  // engine can find it as a drag's source/destination. During render so child
  // items resolve it on their first render (children render after the parent but
  // before any layout effect). The effect's cleanup unregisters on unmount / id
  // or manager change.
  registerController(manager, containerId, controller);
  useEffect(
    () => registerController(manager, containerId, controller),
    [manager, containerId, controller],
  );

  // Attach the manager-wide drag/resize engine (ref-counted; one per manager,
  // shared by every grid on it). Detaches when the last grid for this manager
  // unmounts. No-op without a manager (no provider above).
  useEffect(() => {
    if (!manager) return;
    return attachEngine(manager);
  }, [manager]);

  const committedById = useMemo(
    () => new Map<string, LayoutItem>(opts.layout.map((it) => [it.i, it])),
    [opts.layout],
  );

  const dragThreshold = opts.dragConfig?.threshold ?? 3;
  const itemSensors = useMemo(
    () => buildItemSensors(dragThreshold, () => optsRef.current.dragConfig),
    [dragThreshold],
  );

  // Snap-to-grid modifier (stable descriptor; reads live refs so it never goes
  // stale). A no-op unless `dragConfig.snapToGrid` is set.
  const itemModifiers = useMemo(
    () => [
      SnapToGrid.configure({
        getPositionParams: () => ppRef.current,
        isEnabled: () => optsRef.current.dragConfig?.snapToGrid ?? false,
      }),
    ],
    [],
  );

  const gridDraggable = opts.isDraggable ?? true;
  const dragEnabled = opts.dragConfig?.enabled ?? true;
  const isItemDraggable = useCallback(
    (id: string) => {
      const it = committedById.get(id);
      if (!it) return false;
      return gridDraggable && dragEnabled && itemGateOpen(it.isDraggable, it.static);
    },
    [committedById, gridDraggable, dragEnabled],
  );

  const gridResizable = opts.isResizable ?? true;
  const resizeEnabled = opts.resizeConfig?.enabled ?? true;
  const isItemResizable = useCallback(
    (id: string) => {
      const it = committedById.get(id);
      if (!it) return false;
      return gridResizable && resizeEnabled && itemGateOpen(it.isResizable, it.static);
    },
    [committedById, gridResizable, resizeEnabled],
  );
  const defaultHandles = opts.resizeConfig?.handles;
  const resizeHandlesFor = useCallback(
    (id: string) => committedById.get(id)?.resizeHandles ?? defaultHandles ?? DEFAULT_HANDLES,
    [committedById, defaultHandles],
  );

  // The per-grid callbacks the engine invokes, memoized so a stable consumer
  // doesn't reallocate the object every render (rebuilt only when one changes).
  const callbacks = useMemo(
    () => ({
      onDragStart: opts.onDragStart,
      onDrag: opts.onDrag,
      onDragStop: opts.onDragStop,
      onResizeStart: opts.onResizeStart,
      onResize: opts.onResize,
      onResizeStop: opts.onResizeStop,
      onLayoutChange: opts.onLayoutChange,
      onDrop: opts.onDrop,
    }),
    [
      opts.onDragStart,
      opts.onDrag,
      opts.onDragStop,
      opts.onResizeStart,
      opts.onResize,
      opts.onResizeStop,
      opts.onLayoutChange,
      opts.onDrop,
    ],
  );

  // Publish per-grid config to the controller so items (resolved by group) read
  // fresh geometry/predicates without a React context, and the engine reads this
  // grid's geometry, compaction, gates, and callbacks.
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
    callbacks,
  });

  return controller;
}
