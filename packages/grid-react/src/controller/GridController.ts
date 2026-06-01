import type { DragSession, Layout, LayoutItem } from "@snapgridjs/core";

/** The floating drag preview (a body portal): item + fixed-viewport rect. */
export interface GridOverlayInfo {
  item: LayoutItem;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ItemSnapshot {
  item: LayoutItem | undefined;
  isDragging: boolean;
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
 * (`setSession`/`setOverlay`/`setCommitted`), hooks subscribe to just their own
 * slice via `useSyncExternalStore`. Value-cached snapshots mean a drag re-renders
 * only the tiles whose slice changed, not the whole subtree (the old
 * context-value model re-rendered every tile every frame).
 */
export class GridController {
  #committed: Layout;
  #session: DragSession | null = null;
  #overlay: GridOverlayInfo | null = null;
  #listeners = new Set<() => void>();

  // getSnapshot must return a stable reference while the slice is unchanged
  // (useSyncExternalStore contract, and the basis of the fine-grained re-render).
  #itemCache = new Map<string, ItemSnapshot>();
  #resizeCache = new Map<string, ResizeSnapshot>();
  #placeholderCache: LayoutItem | null = null;

  // Rebuilt only when the rendered layout reference changes.
  #renderedMap: Map<string, LayoutItem> | null = null;
  #renderedMapSource: Layout | null = null;

  constructor(committed: Layout = []) {
    this.#committed = committed;
  }

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
    // biome-ignore lint/style/noNonNullAssertion: set above when source changed.
    return this.#renderedMap!;
  }

  setCommitted(layout: Layout): void {
    if (this.#committed === layout) return; // controlled prop, same ref → no-op
    this.#committed = layout;
    this.#emit();
  }

  setSession(next: DragSession | null): void {
    this.#session = next;
    this.#emit();
  }

  getSession(): DragSession | null {
    return this.#session;
  }

  setOverlay(
    next: GridOverlayInfo | null | ((prev: GridOverlayInfo | null) => GridOverlayInfo | null),
  ): void {
    this.#overlay = typeof next === "function" ? next(this.#overlay) : next;
    this.#emit();
  }

  itemSnapshot = (id: string): ItemSnapshot => {
    const item = this.#renderedById().get(id);
    const isDragging = this.#session?.activeId === id;
    const prev = this.#itemCache.get(id);
    if (prev && prev.isDragging === isDragging && sameItem(prev.item, item)) return prev;
    const snap: ItemSnapshot = { item, isDragging };
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

  overlaySnapshot = (): GridOverlayInfo | null => this.#overlay;

  renderedSnapshot = (): Layout => this.#rendered();
}
