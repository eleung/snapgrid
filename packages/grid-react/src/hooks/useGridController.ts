import { useDragDropManager, useDragDropMonitor, useInstance } from "@dnd-kit/react";
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
import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { GridController } from "../controller/GridController.js";
import { getGrabOffset, registerController, setGrabOffset } from "../controller/registry.js";
import {
  arrowStep,
  classifyDrop,
  dragData,
  dropDestination,
  externalDropSpec,
  receiveCell,
} from "../dnd/dragFlow.js";
import { SnapToGrid } from "../dnd/snapToGrid.js";
import type { DragConfig, DropConfig, GridEventCallback, ResizeConfig } from "../types.js";
import { buildItemSensors } from "./dndShared.js";

const DEFAULT_HANDLES = ["se"] as const;

type Point = { x: number; y: number };

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
 * The grid's brain: owns the {@link GridController}, runs the dnd-kit drag/resize
 * monitor for this grid, and writes per-grid config to the controller each render.
 * Created by {@link useGridContainer}; items resolve the same controller by their
 * `group` (= this grid's id) from the per-manager registry. Consumes the ambient
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

  // Refs read inside the stable monitor handlers so they never see stale values.
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const ppRef = useRef(positionParams);
  ppRef.current = positionParams;
  const gridRef = useRef(gridConfig);
  gridRef.current = gridConfig;
  const compactorRef = useRef(compactor);
  compactorRef.current = compactor;
  const containerIdRef = useRef(containerId);
  containerIdRef.current = containerId;
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const sessionRef = useRef<DragSession | null>(null);
  const containerElRef = useRef<Element | null>(null);
  // True while the active move was started by the keyboard (Enter/Space on a
  // focused tile) rather than a pointer — drives the arrow-key drag path.
  const keyboardRef = useRef(false);
  // External-drop bookkeeping: a stable synthesized item id + size for the
  // in-flight external draggable this grid may receive.
  const dropSpecRef = useRef<{ i: string; w: number; h: number } | null>(null);
  const dropCounterRef = useRef(0);

  // Register the controller so items (and snapMove) resolve it by id. During
  // render so child items resolve it on their first render (children render
  // after the parent but before any layout effect). The effect's cleanup
  // unregisters on unmount / id or manager change.
  registerController(manager, containerId, controller);
  useEffect(
    () => registerController(manager, containerId, controller),
    [manager, containerId, controller],
  );

  const committedById = useMemo(
    () => new Map<string, LayoutItem>(opts.layout.map((it) => [it.i, it])),
    [opts.layout],
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

  // Write the keyboard-drag flag to both the synchronous ref (read in the event
  // handlers) and the controller (drives the reactive `hidden` snapshot).
  const setKeyboard = useCallback(
    (value: boolean) => {
      keyboardRef.current = value;
      controller.setKeyboard(value);
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
    return receiveCell(p, rect, getGrabOffset(managerRef.current), item.w, item.h, ppRef.current);
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
      setKeyboard(false);
      const data = dragData(event);
      if (!data) {
        // An external (non-grid) draggable: if we accept it, reserve a stable
        // synthesized id/size for the item this grid may receive on drop.
        const spec = externalDropSpec(event.operation.source, optsRef.current.dropConfig);
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
      const layout = optsRef.current.layout;
      const item = layout.find((it) => it.i === data.itemId);
      const p = event.operation.position.current;
      const pointer = { x: p.x, y: p.y };
      if (data.kind === "resize") {
        if (!item) return; // resize only applies to the owning grid
        const rect = calcGridItemPosition(ppRef.current, item.x, item.y, item.w, item.h);
        setSessionBoth(beginResize(layout, { item, rect, pointer }, data.handle));
        optsRef.current.onResizeStart?.(
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
        setKeyboard(isKeyboard);
        const rect = calcGridItemPosition(ppRef.current, item.x, item.y, item.w, item.h);
        setSessionBoth(beginDrag(layout, { item, left: rect.left, top: rect.top, pointer }));
        // Share the grab offset (pointer position within the tile) so a receiving
        // grid maps the pointer to the cell under the same point the user grabbed,
        // not the tile's corner.
        const el = (event.operation.source as { element?: Element } | null)?.element;
        const cr = el?.getBoundingClientRect();
        if (cr) {
          setGrabOffset(managerRef.current, { x: pointer.x - cr.left, y: pointer.y - cr.top });
        }
        optsRef.current.onDragStart?.(
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
    [setSessionBoth, setKeyboard],
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
        optsRef.current.onResize?.(
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
          const committed = optsRef.current.layout;
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
          // here; the dragged tile floats itself across grids (no overlay).
          next = {
            ...source,
            preview: source.committed as LayoutItem[],
            placeholder: null,
          };
        }
        setSessionBoth(next);
        optsRef.current.onDrag?.(
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
        const committed = optsRef.current.layout;
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
      // A keyboard drop always commits in-grid; a pointer drop uses the collision
      // target (see dropDestination).
      const dest = dropDestination({
        keyboard: keyboardRef.current,
        targetId: event.operation.target?.id,
        myId,
      });
      const ownsItem = data ? committedByIdRef.current.has(data.itemId) : false;
      setGrabOffset(managerRef.current, null);

      const native = event.nativeEvent ?? null;
      const o = optsRef.current;
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
          o.onResizeStop?.(o.layout, current?.anchor.item ?? null, null, null, native, null);
          break;
        case "cancel-move":
          o.onDragStop?.(o.layout, current?.anchor.item ?? null, null, null, native, null);
          break;
        case "commit-resize":
          if (current) {
            o.onLayoutChange?.(commitLayout(current));
            o.onResizeStop?.(
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
            o.onLayoutChange?.(commitLayout(current));
          } else if (action === "remove-source" && data) {
            const { compactor: c, cols } = ctx();
            o.onLayoutChange?.(
              removeItemWithCompactor(o.layout, data.itemId, { compactor: c, cols }),
            );
          } // "revert" → dropped outside any grid → no layout change.
          o.onDragStop?.(
            current?.preview ?? o.layout,
            current?.anchor.item ?? null,
            current?.placeholder ?? null,
            current?.placeholder ?? null,
            native,
            null,
          );
          break;
        }
        case "commit-dest":
          if (current) o.onLayoutChange?.(commitLayout(current));
          break;
        case "external-drop":
          // Hand the synthesized item to onDrop so the consumer can add it.
          if (current) {
            const committed = commitLayout(current);
            const dropped = committed.find((it) => it.i === current.activeId);
            if (dropped) o.onDrop?.(committed, dropped, native);
          }
          break;
        // "noop" → nothing to do.
      }
      dropSpecRef.current = null;
      setKeyboard(false);
      setSessionBoth(null);
    },
    [setSessionBoth, setKeyboard, ctx],
  );

  // Keyboard dragging: while a keyboard-initiated move is active, arrow keys step
  // the tile one cell at a time (it moves in place via the session preview — no
  // overlay). Enter / Space (drop) and Escape (cancel) fall through to dnd-kit's
  // KeyboardSensor.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keyboardRef.current) return;
      const session = sessionRef.current;
      if (!session || session.kind !== "move") return;
      const step = arrowStep(e.key);
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
      return gridDraggable && dragEnabled && (it.isDraggable ?? true) && !it.static;
    },
    [committedById, gridDraggable, dragEnabled],
  );

  const gridResizable = opts.isResizable ?? true;
  const resizeEnabled = opts.resizeConfig?.enabled ?? true;
  const isItemResizable = useCallback(
    (id: string) => {
      const it = committedById.get(id);
      if (!it) return false;
      return gridResizable && resizeEnabled && (it.isResizable ?? true) && !it.static;
    },
    [committedById, gridResizable, resizeEnabled],
  );
  const defaultHandles = opts.resizeConfig?.handles;
  const resizeHandlesFor = useCallback(
    (id: string) => committedById.get(id)?.resizeHandles ?? defaultHandles ?? DEFAULT_HANDLES,
    [committedById, defaultHandles],
  );

  // Publish per-grid config to the controller so items (resolved by group) read
  // fresh geometry/predicates without a React context.
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
    setContainerElement,
  });

  return controller;
}
