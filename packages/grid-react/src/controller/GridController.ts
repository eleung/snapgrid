import type { Modifiers, Sensors } from "@dnd-kit/abstract";
import type { DragDropManager } from "@dnd-kit/dom";
import type {
  DragSession,
  GridConfig,
  Layout,
  LayoutItem,
  PositionParams,
  ResizeHandleAxis,
} from "@snapgridjs/core";

/**
 * Per-grid configuration the container host writes to the controller each render
 * (during render, so items that resolve this controller by `group` read fresh
 * config on the same pass). Replaces the fields the old GridContext exposed.
 */
export interface GridControllerConfig {
  positionParams: PositionParams;
  gridConfig: GridConfig;
  width: number;
  autoSize: boolean;
  itemSensors: Sensors;
  itemModifiers: Modifiers;
  isItemDraggable: (id: string) => boolean;
  isItemResizable: (id: string) => boolean;
  resizeHandlesFor: (id: string) => readonly ResizeHandleAxis[];
  /** Report the container element (used to map a pointer to a cell on receive). */
  setContainerElement: (element: Element | null) => void;
}

export interface ItemSnapshot {
  item: LayoutItem | undefined;
  isDragging: boolean;
  // Hide the in-grid tile: true only for a *pointer* drag (its clone floats in
  // the overlay). Keyboard drags have no overlay, so the tile stays visible.
  hidden: boolean;
}

export interface ResizeSnapshot {
  isResizing: boolean;
}

function sameItem(a: LayoutItem | undefined, b: LayoutItem | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  // Only the fields that affect what a tile renders/positions. Layout items are
  // immutable, so the compactor may hand back a fresh object for an *unmoved*
  // tile each frame — comparing by value (not identity) is what keeps that tile
  // from re-rendering during someone else's drag.
  return a.i === b.i && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/**
 * Live per-grid drag/resize state as a plain observable: the provider writes
 * (`setSession`/`setKeyboard`/`setCommitted`), hooks subscribe to just their own
 * slice via `useSyncExternalStore`. Value-cached snapshots mean a drag re-renders
 * only the tiles whose slice changed, not the whole subtree (the old
 * context-value model re-rendered every tile every frame).
 */
export class GridController {
  readonly id: string;
  #committed: Layout;
  #session: DragSession | null = null;
  // True while the active drag was started by the keyboard (no floating overlay
  // → the in-grid tile must stay visible and move in place).
  #keyboard = false;
  #listeners = new Set<() => void>();
  // Per-grid config, written by the container host each render (see setConfig).
  // Non-null once mounted; items only read it after resolving a registered grid.
  config: GridControllerConfig | null = null;

  // getSnapshot must return a stable reference while the slice is unchanged
  // (useSyncExternalStore contract, and the basis of the fine-grained re-render).
  #itemCache = new Map<string, ItemSnapshot>();
  #resizeCache = new Map<string, ResizeSnapshot>();
  #placeholderCache: LayoutItem | null = null;

  // Rebuilt only when the rendered layout reference changes.
  #renderedMap: Map<string, LayoutItem> | null = null;
  #renderedMapSource: Layout | null = null;

  /** The dnd-kit manager this grid is registered with (set by useInstance). */
  manager: DragDropManager | undefined;

  constructor(id: string, committed: Layout = [], manager?: DragDropManager) {
    this.id = id;
    this.#committed = committed;
    this.manager = manager;
  }

  /** Replace the per-grid config (called by the container host during render). */
  setConfig(config: GridControllerConfig): void {
    this.config = config;
  }

  // Satisfies dnd-kit's `Instance` interface (useInstance calls this in a layout
  // effect). Registry registration is handled by the host hook (it must happen
  // during render so child items resolve this controller on their first render),
  // so there's nothing to do here.
  register = (): void => {};

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  #emit(): void {
    for (const listener of this.#listeners) listener();
  }

  /** The layout currently shown: the drag preview while dragging, else committed. */
  #rendered(): Layout {
    return this.#session ? (this.#session.preview as Layout) : this.#committed;
  }

  #renderedById(): Map<string, LayoutItem> {
    const rendered = this.#rendered();
    if (this.#renderedMapSource !== rendered) {
      this.#renderedMap = new Map(rendered.map((it) => [it.i, it]));
      this.#renderedMapSource = rendered;
    }
    return this.#renderedMap!;
  }

  /**
   * Sync the committed layout from the controlled `layout` prop. Called during
   * the provider's render, so it must NOT notify — emitting here would update
   * subscribed GridItems mid-render (a React "setState while rendering" error).
   * No notify is needed: a `layout` prop change already re-renders the whole
   * provider subtree, so every GridItem re-reads its snapshot on that pass.
   */
  setCommitted(layout: Layout): void {
    this.#committed = layout;
  }

  setSession(next: DragSession | null): void {
    this.#session = next;
    this.#emit();
  }

  getSession(): DragSession | null {
    return this.#session;
  }

  /** Record whether the active drag is keyboard-driven (drives `hidden`). */
  setKeyboard(value: boolean): void {
    if (this.#keyboard === value) return;
    this.#keyboard = value;
    this.#emit();
  }

  itemSnapshot = (id: string): ItemSnapshot => {
    const item = this.#renderedById().get(id);
    const isDragging = this.#session?.activeId === id;
    const hidden = isDragging && this.#session?.kind === "move" && !this.#keyboard;
    const prev = this.#itemCache.get(id);
    if (
      prev &&
      prev.isDragging === isDragging &&
      prev.hidden === hidden &&
      sameItem(prev.item, item)
    ) {
      return prev;
    }
    const snap: ItemSnapshot = { item, isDragging, hidden };
    this.#itemCache.set(id, snap);
    return snap;
  };

  placeholderSnapshot = (): LayoutItem | null => {
    const next = this.#session?.placeholder ?? null;
    if (sameItem(this.#placeholderCache ?? undefined, next ?? undefined)) {
      return this.#placeholderCache;
    }
    this.#placeholderCache = next;
    return next;
  };

  resizeSnapshot = (itemId: string): ResizeSnapshot => {
    const isResizing = this.#session?.kind === "resize" && this.#session.activeId === itemId;
    const prev = this.#resizeCache.get(itemId);
    if (prev && prev.isResizing === isResizing) return prev;
    const snap: ResizeSnapshot = { isResizing };
    this.#resizeCache.set(itemId, snap);
    return snap;
  };

  renderedSnapshot = (): Layout => this.#rendered();
}
