import {
  type CompactType,
  type Compactor,
  type Layout,
  type LayoutItem,
  bottom,
  cloneLayout,
  cloneLayoutItem,
  getAllCollisions,
  moveElement,
} from "./rgl.js";

/** Compaction types that react-grid-layout's `moveElement` understands natively. */
const BUILTIN_COMPACT_TYPES: ReadonlySet<CompactType> = new Set<CompactType>([
  "vertical",
  "horizontal",
  "wrap",
  null,
]);

export interface MoveItemOptions {
  /** The compaction strategy to apply after the move. */
  compactor: Compactor;
  /** Number of columns in the grid. */
  cols: number;
  /** Whether this move was triggered directly by the user (vs. a cascade). */
  isUserAction?: boolean;
}

/**
 * Move `item` to grid coordinate `(x, y)` and re-pack the layout using the
 * supplied {@link Compactor}.
 *
 * `react-grid-layout`'s `moveElement` only understands the built-in compaction
 * types (`vertical` / `horizontal` / `wrap` / `null`). For a custom packing
 * style (masonry, gravity, shelf, …) we run `moveElement` without compaction
 * and then hand the result to the compactor's own `compact()`.
 */
export function moveItemWithCompactor(
  layout: Layout,
  item: LayoutItem,
  x: number,
  y: number,
  { compactor, cols, isUserAction = true }: MoveItemOptions,
): LayoutItem[] {
  const builtin = BUILTIN_COMPACT_TYPES.has(compactor.type);

  // `moveElement` mutates the items it is given, so operate on a clone and
  // resolve the target item within it. The caller's layout stays untouched.
  const work = cloneLayout(layout) as LayoutItem[];
  const target = work.find((it) => it.i === item.i);
  if (!target) {
    throw new Error(`moveItemWithCompactor: item "${item.i}" not found in layout`);
  }

  // `moveElement` places the item (resolving collisions for the built-in
  // compaction types; for a custom compactor `type` is `null`, so it is placed
  // at the dropped cell without a cascade). The compactor then repacks.
  const moved = moveElement(
    work,
    target,
    x,
    y,
    isUserAction,
    compactor.preventCollision ?? false,
    builtin ? compactor.type : null,
    cols,
    compactor.allowOverlap,
  );

  if (compactor.allowOverlap) {
    return moved;
  }
  return compactor.compact(moved, cols) as LayoutItem[];
}

export interface ResizeItemOptions {
  /** The compaction strategy to apply after the resize. */
  compactor: Compactor;
  /** Number of columns in the grid. */
  cols: number;
}

/**
 * Apply a new position/size to `item` and re-pack the layout.
 *
 * If the compactor allows overlap, the resized item is left as-is. If it
 * prevents collisions and the new size would collide, the resize is rejected
 * (the original layout is returned). Otherwise the compactor reflows the rest
 * of the grid around the resized item.
 */
export function resizeItemWithCompactor(
  layout: Layout,
  item: LayoutItem,
  next: { x: number; y: number; w: number; h: number },
  { compactor, cols }: ResizeItemOptions,
): LayoutItem[] {
  const work = cloneLayout(layout) as LayoutItem[];
  const target = work.find((it) => it.i === item.i);
  if (!target) {
    throw new Error(`resizeItemWithCompactor: item "${item.i}" not found in layout`);
  }
  target.x = next.x;
  target.y = next.y;
  target.w = next.w;
  target.h = next.h;

  if (compactor.allowOverlap) {
    return work;
  }
  if (compactor.preventCollision) {
    const collisions = getAllCollisions(work, target).filter((it) => it.i !== target.i);
    if (collisions.length > 0) {
      // Reject: keep the pre-resize layout.
      return cloneLayout(layout) as LayoutItem[];
    }
  }
  return compactor.compact(work, cols) as LayoutItem[];
}

/** Remove the item with `id` from the layout and re-pack the remainder. */
export function removeItemWithCompactor(
  layout: Layout,
  id: string,
  { compactor, cols }: ResizeItemOptions,
): LayoutItem[] {
  const work = (cloneLayout(layout) as LayoutItem[]).filter((it) => it.i !== id);
  if (compactor.allowOverlap) return work;
  return compactor.compact(work, cols) as LayoutItem[];
}

/**
 * Insert `item` (from another grid) at grid coordinate `(x, y)` and re-pack.
 * If an item with the same id already exists it is moved instead of duplicated.
 */
export function insertItemWithCompactor(
  layout: Layout,
  item: LayoutItem,
  x: number,
  y: number,
  { compactor, cols }: ResizeItemOptions,
): LayoutItem[] {
  if (layout.some((it) => it.i === item.i)) {
    return moveItemWithCompactor(layout, { ...item, x, y }, x, y, { compactor, cols });
  }
  // Seed the new item BELOW the content for the built-in cascades, so the
  // moveElement below moves it UP into (x, y) and displaces whatever's there.
  // Adding it straight at (x, y) makes that move a no-op (it's already there), so
  // a received tile could never land in an occupied row — e.g. the target grid's
  // top row. Custom packers repack everything in compact(), so the seed row
  // doesn't matter for them.
  const seedY = BUILTIN_COMPACT_TYPES.has(compactor.type) ? bottom(layout) : y;
  const base: Layout = [...layout, { ...cloneLayoutItem(item), x, y: seedY, moved: false }];
  return moveItemWithCompactor(base, { ...item, x, y }, x, y, { compactor, cols });
}
