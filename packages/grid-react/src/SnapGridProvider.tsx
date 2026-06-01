import { useDragDropMonitor } from "@dnd-kit/react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/react";
import {
  type Compactor,
  type DragSession,
  type GridConfig,
  type Layout,
  type LayoutItem,
  type PositionParams,
  beginDrag,
  beginReceive,
  beginResize,
  calcGridItemPosition,
  commitLayout,
  defaultGridConfig,
  dragResize,
  dragTo,
  nudge,
  removeItemWithCompactor,
  toPositionParams,
  verticalCompactor,
} from "@snapgridjs/core";
import { type ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef } from "react";
import { GridContext, type GridRuntime, type SnapGridDragData } from "./context.js";
import { GridController } from "./controller/GridController.js";
import { SnapToGrid } from "./dnd/snapToGrid.js";
import { classifyDrop, receiveCell } from "./dragFlow.js";
import { type GridRegistry, SnapGridGroupContext, createGridRegistry } from "./grouping.js";
import { buildItemSensors } from "./hooks/dndShared.js";
import type {
  DragConfig,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "./types.js";

const DEFAULT_HANDLES = ["se"] as const;

type Point = { x: number; y: number };

/** Read snapgrid's payload off a dnd-kit drag source. */
function dragData(event: {
  operation: { source?: { data?: unknown } | null };
}): SnapGridDragData | undefined {
  const data = event.operation.source?.data as { snapGrid?: SnapGridDragData } | undefined;
  return data?.snapGrid;
}

/** Size/id spec for an external (non-grid) draggable the grid may accept, or null. */
export function externalDropSpec(
  source: { id: string | number; type?: unknown; data?: unknown } | null | undefined,
  dropConfig: DropConfig | undefined,
): { i?: string; w: number; h: number } | null {
  if (!dropConfig?.enabled || !source) return null;
  const data = source.data as { snapGrid?: unknown; snapGridDrop?: GridDropData } | undefined;
  if (data?.snapGrid) return null; // a grid item, not external
  if (dropConfig.accept && !dropConfig.accept(source)) return null;
  const spec = data?.snapGridDrop;
  return {
    i: spec?.i,
    // Fall back to react-grid-layout's `defaultDropConfig.defaultItem` (1×1) for parity.
    w: spec?.w ?? dropConfig.defaultItem?.w ?? 1,
    h: spec?.h ?? dropConfig.defaultItem?.h ?? 1,
  };
}

export interface SnapGridProviderProps {
  children: ReactNode;
  /** Container width in pixels (e.g. from {@link useContainerWidth}). */
  width: number;
  /** Controlled layout. Never mutated. */
  layout: Layout;
  /** Called with the next layout after a drag/resize commits (incl. cross-grid add/remove). */
  onLayoutChange?: (layout: Layout) => void;
  gridConfig?: Partial<GridConfig>;
  dragConfig?: DragConfig;
  resizeConfig?: ResizeConfig;
  /** Accept external (non-grid) dnd-kit draggables dropped into this grid. */
  dropConfig?: DropConfig;
  compactor?: Compactor;
  /** Grid-level draggable toggle (item-level `isDraggable`/`static` override). @default true */
  isDraggable?: boolean;
  /** Grid-level resizable toggle (item-level `isResizable`/`static` override). @default true */
  isResizable?: boolean;
  /** Grow container height to fit content. @default true */
  autoSize?: boolean;
  /** Stable id for the grid's droppable surface (auto-generated if omitted). */
  id?: string;
  onDragStart?: GridEventCallback;
  onDrag?: GridEventCallback;
  onDragStop?: GridEventCallback;
  onResizeStart?: GridEventCallback;
  onResize?: GridEventCallback;
  onResizeStop?: GridEventCallback;
  /** Called when an external draggable is dropped into the grid: the next layout, the new item, and the event. */
  onDrop?: (layout: Layout, item: LayoutItem, event: Event | null) => void;
}

/**
 * Headless provider for a grid. Consumes an ambient dnd-kit `DragDropProvider`
 * (supplied by {@link GridLayout} for turnkey use, by a {@link SnapGridGroup}
 * for cross-grid drags, or by the consumer in a headless app) — it does not mint
 * one itself. Owns this grid's drag/resize session; the consumer owns all
 * markup/styling.
 */
export function SnapGridProvider(props: SnapGridProviderProps): React.JSX.Element {
  const groupRegistry = useContext(SnapGridGroupContext);
  return <SnapGridRuntime groupRegistry={groupRegistry} {...props} />;
}

type RuntimeProps = SnapGridProviderProps & { groupRegistry: GridRegistry | null };

function SnapGridRuntime(props: RuntimeProps): React.JSX.Element {
  const autoId = useId();
  const containerId = props.id ?? autoId;

  const gridConfig: GridConfig = useMemo(
    () => ({ ...defaultGridConfig, ...props.gridConfig }),
    [props.gridConfig],
  );
  const positionParams: PositionParams = useMemo(
    () => toPositionParams(gridConfig, props.width),
    [gridConfig, props.width],
  );
  const compactor: Compactor = props.compactor ?? verticalCompactor;

  // The live drag/resize store (see GridController), stable per grid instance.
  const controllerRef = useRef<GridController | null>(null);
  if (!controllerRef.current) controllerRef.current = new GridController(props.layout);
  const controller = controllerRef.current;
  controller.setCommitted(props.layout);

  // Refs read inside the stable monitor handlers so they never see stale values.
  const propsRef = useRef(props);
  propsRef.current = props;
  const ppRef = useRef(positionParams);
  ppRef.current = positionParams;
  const gridRef = useRef(gridConfig);
  gridRef.current = gridConfig;
  const compactorRef = useRef(compactor);
  compactorRef.current = compactor;
  const containerIdRef = useRef(containerId);
  containerIdRef.current = containerId;
  const sessionRef = useRef<DragSession | null>(null);
  const containerElRef = useRef<Element | null>(null);
  // True while the active move was started by the keyboard (Enter/Space on a
  // focused tile) rather than a pointer — drives the arrow-key drag path.
  const keyboardRef = useRef(false);
  // External-drop bookkeeping: a stable synthesized item id + size for the
  // in-flight external draggable this grid may receive.
  const dropSpecRef = useRef<{ i: string; w: number; h: number } | null>(null);
  const dropCounterRef = useRef(0);

  // Each grid registers with a shared registry (group) or its own (standalone)
  // so we can resolve which grid the pointer is over by geometry — dnd-kit's
  // collision target is unavailable under `feedback: 'none'`.
  const localRegistryRef = useRef<GridRegistry | null>(null);
  if (!localRegistryRef.current) localRegistryRef.current = createGridRegistry();
  const registry = props.groupRegistry ?? localRegistryRef.current;
  const registryRef = useRef(registry);
  registryRef.current = registry;

  useEffect(
    () =>
      registry.register(containerId, () => containerElRef.current?.getBoundingClientRect() ?? null),
    [registry, containerId],
  );

  const committedById = useMemo(
    () => new Map<string, LayoutItem>(props.layout.map((it) => [it.i, it])),
    [props.layout],
  );
  const committedByIdRef = useRef(committedById);
  committedByIdRef.current = committedById;

  const setSessionBoth = useCallback(
    (next: DragSession | null) => {
      sessionRef.current = next;
      controller.setSession(next);
    },
    [controller],
  );

  const setContainerElement = useCallback((element: Element | null) => {
    containerElRef.current = element;
  }, []);

  /**
   * Is THIS grid the drop target dnd-kit's collision observer resolved? Both the
   * move-phase preview and the drop-phase commit read `operation.target`, so they
   * always agree on which grid wins (one oracle), including when grids overlap.
   */
  const overMe = useCallback(
    (target: { id: string | number } | null | undefined) => target?.id === containerIdRef.current,
    [],
  );

  /** Map a client-space pointer to a grid cell within THIS grid (see {@link receiveCell}). */
  const cellFromPointer = useCallback((p: Point, item: LayoutItem) => {
    const el = containerElRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return receiveCell(p, rect, registryRef.current.getGrabOffset(), item.w, item.h, ppRef.current);
  }, []);

  const ctx = useCallback(
    () => ({
      positionParams: ppRef.current,
      compactor: compactorRef.current,
      cols: gridRef.current.cols,
    }),
    [],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      // Reset on every start (incl. the external/resize early-returns below) so a
      // keyboard flag can never leak from a prior drag into an unrelated one.
      keyboardRef.current = false;
      controller.setKeyboard(false);
      const data = dragData(event);
      if (!data) {
        // An external (non-grid) draggable: if we accept it, reserve a stable
        // synthesized id/size for the item this grid may receive on drop.
        const spec = externalDropSpec(event.operation.source, propsRef.current.dropConfig);
        if (spec) {
          dropCounterRef.current += 1;
          dropSpecRef.current = {
            // Prefix with this grid's id so two drop-enabled grids in a group
            // don't both mint `dropped-1` (colliding item ids).
            i: spec.i ?? `${containerIdRef.current}-dropped-${dropCounterRef.current}`,
            w: spec.w,
            h: spec.h,
          };
        } else {
          dropSpecRef.current = null;
        }
        return;
      }
      dropSpecRef.current = null;
      const layout = propsRef.current.layout;
      const item = layout.find((it) => it.i === data.itemId);
      const p = event.operation.position.current;
      const pointer = { x: p.x, y: p.y };
      if (data.kind === "resize") {
        if (!item) return; // resize only applies to the owning grid
        const rect = calcGridItemPosition(ppRef.current, item.x, item.y, item.w, item.h);
        setSessionBoth(beginResize(layout, { item, rect, pointer }, data.handle));
        propsRef.current.onResizeStart?.(
          layout,
          item,
          item,
          item,
          event.operation.activatorEvent,
          null,
        );
        return;
      }
      if (item) {
        // We own the item — this is the source grid.
        const isKeyboard = event.operation.activatorEvent instanceof KeyboardEvent;
        keyboardRef.current = isKeyboard;
        controller.setKeyboard(isKeyboard);
        const rect = calcGridItemPosition(ppRef.current, item.x, item.y, item.w, item.h);
        setSessionBoth(beginDrag(layout, { item, left: rect.left, top: rect.top, pointer }));
        // Share the grab offset (pointer position within the tile) so a receiving
        // grid maps the pointer to the cell under the same point the user grabbed,
        // not the tile's corner.
        const el = (event.operation.source as { element?: Element } | null)?.element;
        const cr = el?.getBoundingClientRect();
        if (cr) {
          registryRef.current.setGrabOffset({ x: pointer.x - cr.left, y: pointer.y - cr.top });
        }
        propsRef.current.onDragStart?.(
          layout,
          item,
          item,
          item,
          event.operation.activatorEvent,
          null,
        );
      }
      // Otherwise the item belongs to another grid; we may receive it on move.
    },
    [setSessionBoth, controller],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      // Keyboard moves are driven entirely by the arrow-key handler below; ignore
      // dnd-kit's (pointerless, therefore no-op) move events so they can't revert
      // a nudge back to the static activator cell.
      if (keyboardRef.current) return;
      const p = event.operation.position.current;
      const pointer = { x: p.x, y: p.y };
      const current = sessionRef.current;

      if (current?.kind === "resize") {
        const next = dragResize(current, pointer, ctx());
        setSessionBoth(next);
        propsRef.current.onResize?.(
          next.preview,
          next.anchor.item,
          next.placeholder,
          next.placeholder,
          event.operation.activatorEvent,
          null,
        );
        return;
      }

      const target = event.operation.target;
      const data = dragData(event);
      if (!data) {
        // External (non-grid) draggable: preview where it would land over us.
        const spec = dropSpecRef.current;
        if (spec && overMe(target)) {
          const foreign: LayoutItem = { i: spec.i, x: 0, y: 0, w: spec.w, h: spec.h };
          const committed = propsRef.current.layout;
          const cell = cellFromPointer(pointer, foreign) ?? { x: 0, y: 0 };
          setSessionBoth(beginReceive(committed, foreign, cell.x, cell.y, pointer, ctx()));
        } else if (sessionRef.current) {
          setSessionBoth(null);
        }
        return;
      }
      if (data.kind !== "move") return;
      const here = overMe(target);
      const ownsItem = committedByIdRef.current.has(data.itemId);

      if (ownsItem) {
        const source = current?.kind === "move" ? current : null;
        if (!source) return;
        let next: DragSession;
        if (here) {
          next = dragTo(source, pointer, ctx());
        } else {
          // Leaving this grid: keep the item in place and hide the placeholder
          // here; the dnd-kit overlay clone tracks the pointer across grids.
          next = {
            ...source,
            preview: source.committed as LayoutItem[],
            placeholder: null,
          };
        }
        setSessionBoth(next);
        propsRef.current.onDrag?.(
          next.preview,
          next.anchor.item,
          next.placeholder,
          next.placeholder,
          event.operation.activatorEvent,
          null,
        );
        return;
      }

      // We don't own the item — maybe receive it.
      if (here) {
        const foreign = data.item;
        const committed = propsRef.current.layout;
        const cell = cellFromPointer(pointer, foreign) ?? { x: 0, y: 0 };
        setSessionBoth(beginReceive(committed, foreign, cell.x, cell.y, pointer, ctx()));
      } else if (sessionRef.current) {
        setSessionBoth(null); // pointer left; we're no longer receiving
      }
    },
    [setSessionBoth, overMe, cellFromPointer, ctx],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const current = sessionRef.current;
      const data = dragData(event);
      const myId = containerIdRef.current;
      // Keyboard drags are in-grid only (there is no pointer to land in another
      // grid), so a keyboard drop always commits to this grid; otherwise the drop
      // target is whichever grid the collision observer resolved.
      const targetId = event.operation.target?.id;
      const dest = keyboardRef.current ? myId : targetId != null ? String(targetId) : null;
      const ownsItem = data ? committedByIdRef.current.has(data.itemId) : false;
      registryRef.current.setGrabOffset(null);

      const native = event.nativeEvent ?? null;
      const p2 = propsRef.current;
      // Pure classification of what this drop means for THIS grid; the switch
      // below maps each action to its callbacks (see dragFlow.ts for the contract).
      const action = classifyDrop({
        kind: current?.kind ?? null,
        canceled: event.canceled,
        ownsItem,
        hasData: !!data,
        dest,
        myId,
      });

      switch (action) {
        case "cancel-resize":
          p2.onResizeStop?.(p2.layout, current?.anchor.item ?? null, null, null, native, null);
          break;
        case "cancel-move":
          p2.onDragStop?.(p2.layout, current?.anchor.item ?? null, null, null, native, null);
          break;
        case "commit-resize":
          if (current) {
            p2.onLayoutChange?.(commitLayout(current));
            p2.onResizeStop?.(
              current.preview,
              current.anchor.item,
              current.placeholder,
              current.placeholder,
              native,
              null,
            );
          }
          break;
        case "commit-in-grid":
        case "remove-source":
        case "revert": {
          // Source grid finishing its drag: all fire onDragStop, differing only in layout.
          if (action === "commit-in-grid" && current) {
            p2.onLayoutChange?.(commitLayout(current));
          } else if (action === "remove-source" && data) {
            const { compactor: c, cols } = ctx();
            p2.onLayoutChange?.(
              removeItemWithCompactor(p2.layout, data.itemId, { compactor: c, cols }),
            );
          } // "revert" → dropped outside any grid → no layout change.
          p2.onDragStop?.(
            current?.preview ?? p2.layout,
            current?.anchor.item ?? null,
            current?.placeholder ?? null,
            current?.placeholder ?? null,
            native,
            null,
          );
          break;
        }
        case "commit-dest":
          if (current) p2.onLayoutChange?.(commitLayout(current));
          break;
        case "external-drop":
          // Hand the synthesized item to onDrop so the consumer can add it.
          if (current) {
            const committed = commitLayout(current);
            const dropped = committed.find((it) => it.i === current.activeId);
            if (dropped) p2.onDrop?.(committed, dropped, native);
          }
          break;
        // "noop" → nothing to do.
      }
      dropSpecRef.current = null;
      keyboardRef.current = false;
      controller.setKeyboard(false);
      setSessionBoth(null);
    },
    [setSessionBoth, controller, ctx],
  );

  // Keyboard dragging: while a keyboard-initiated move is active, arrow keys step
  // the tile one cell at a time (it moves in place via the session preview — no
  // overlay). Enter / Space (drop) and Escape (cancel) fall through to dnd-kit's
  // KeyboardSensor.
  useEffect(() => {
    const STEP: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keyboardRef.current) return;
      const session = sessionRef.current;
      if (!session || session.kind !== "move") return;
      const step = STEP[e.key];
      if (!step) return; // Enter/Space/Escape → dnd-kit handles drop/cancel
      e.preventDefault();
      // Own the arrow: stop dnd-kit's KeyboardSensor (a document capture-phase
      // listener) from also moving — otherwise its internal operation position
      // drifts every keystroke. We run in capture on window, ahead of it.
      e.stopImmediatePropagation();
      setSessionBoth(nudge(session, step[0], step[1], ctx()));
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [ctx, setSessionBoth]);

  // Stable handlers object: dnd-kit's monitor effect keys on the handlers
  // identity, so a fresh literal each render would tear down and re-add all
  // listeners on every render (i.e. every pointer move, for every grid).
  const monitorHandlers = useMemo(
    () => ({
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragMove, handleDragEnd],
  );
  useDragDropMonitor(monitorHandlers);

  const dragThreshold = props.dragConfig?.threshold ?? 3;
  const itemSensors = useMemo(
    () => buildItemSensors(dragThreshold, () => propsRef.current.dragConfig),
    [dragThreshold],
  );

  // Snap-to-grid modifier (stable descriptor; reads live refs so it never goes
  // stale). A no-op unless `dragConfig.snapToGrid` is set.
  const itemModifiers = useMemo(
    () => [
      SnapToGrid.configure({
        getPositionParams: () => ppRef.current,
        isEnabled: () => propsRef.current.dragConfig?.snapToGrid ?? false,
      }),
    ],
    [],
  );

  const gridDraggable = props.isDraggable ?? true;
  const dragEnabled = props.dragConfig?.enabled ?? true;
  const isItemDraggable = useCallback(
    (id: string) => {
      const it = committedById.get(id);
      if (!it) return false;
      return gridDraggable && dragEnabled && (it.isDraggable ?? true) && !it.static;
    },
    [committedById, gridDraggable, dragEnabled],
  );

  const gridResizable = props.isResizable ?? true;
  const resizeEnabled = props.resizeConfig?.enabled ?? true;
  const isItemResizable = useCallback(
    (id: string) => {
      const it = committedById.get(id);
      if (!it) return false;
      return gridResizable && resizeEnabled && (it.isResizable ?? true) && !it.static;
    },
    [committedById, gridResizable, resizeEnabled],
  );
  const defaultHandles = props.resizeConfig?.handles;
  const resizeHandlesFor = useCallback(
    (id: string) => committedById.get(id)?.resizeHandles ?? defaultHandles ?? DEFAULT_HANDLES,
    [committedById, defaultHandles],
  );

  const runtime: GridRuntime = useMemo(
    () => ({
      containerId,
      width: props.width,
      autoSize: props.autoSize ?? true,
      gridConfig,
      positionParams,
      controller,
      isItemDraggable,
      isItemResizable,
      resizeHandlesFor,
      itemSensors,
      itemModifiers,
      setContainerElement,
    }),
    [
      containerId,
      props.width,
      props.autoSize,
      gridConfig,
      positionParams,
      controller,
      isItemDraggable,
      isItemResizable,
      resizeHandlesFor,
      itemSensors,
      itemModifiers,
      setContainerElement,
    ],
  );

  return <GridContext.Provider value={runtime}>{props.children}</GridContext.Provider>;
}
