import {
  type Compactor,
  type Layout,
  type LayoutItem,
  clamp,
  sortLayoutItemsByRowCol,
} from "@snapgrid/core";

/**
 * Custom packing styles. They report `type: null` (free-positioning from
 * react-grid-layout's perspective) and do the real packing in `compact()`, so
 * the dropped cell only influences ORDER while the algorithm decides positions.
 *
 * Note: unlike the built-in compactors, these repack *all* items and do not
 * preserve `static` placement or honor `maxRows` (the `Compactor.compact`
 * contract takes only `cols`) — use a built-in compactor when you need either.
 */

/** A growable cell-occupancy bitmap. */
class Occupancy {
  private rows: boolean[][] = [];
  constructor(private readonly cols: number) {}

  private ensure(y: number): boolean[] {
    while (this.rows.length <= y) this.rows.push(new Array(this.cols).fill(false));
    return this.rows[y] as boolean[];
  }

  fits(x: number, y: number, w: number, h: number): boolean {
    if (x < 0 || y < 0 || x + w > this.cols) return false;
    for (let yy = y; yy < y + h; yy++) {
      const row = this.ensure(yy);
      for (let xx = x; xx < x + w; xx++) if (row[xx]) return false;
    }
    return true;
  }

  mark(x: number, y: number, w: number, h: number): void {
    for (let yy = y; yy < y + h; yy++) {
      const row = this.ensure(yy);
      for (let xx = x; xx < x + w; xx++) row[xx] = true;
    }
  }

  /** First free position scanning row-major (top-left first). */
  firstFit(w: number, h: number): { x: number; y: number } {
    for (let y = 0; ; y++) {
      for (let x = 0; x <= this.cols - w; x++) {
        if (this.fits(x, y, w, h)) return { x, y };
      }
    }
  }

  /** Topmost position at column `x` (drop the item straight down). */
  dropAt(x: number, w: number, h: number): number {
    let y = 0;
    while (!this.fits(x, y, w, h)) y++;
    return y;
  }
}

/** Top-left gravity: each item falls into the earliest free hole (row-major). */
export function gravityCompact(layout: Layout, colsInput: number): LayoutItem[] {
  // A grid with < 1 column is degenerate; treat it as a single column rather
  // than letting firstFit/dropAt spin forever (`cols - w` never goes >= 0).
  const cols = Math.max(1, colsInput);
  const occ = new Occupancy(cols);
  const out: LayoutItem[] = [];
  for (const it of sortLayoutItemsByRowCol(layout)) {
    const w = clamp(it.w, 1, cols);
    const { x, y } = occ.firstFit(w, it.h);
    occ.mark(x, y, w, it.h);
    out.push({ ...it, x, y, w });
  }
  return out;
}

/** Masonry: minimize height by dropping each item into its shortest column span. */
export function masonryCompact(layout: Layout, colsInput: number): LayoutItem[] {
  const cols = Math.max(1, colsInput);
  const occ = new Occupancy(cols);
  const out: LayoutItem[] = [];
  for (const it of sortLayoutItemsByRowCol(layout)) {
    const w = clamp(it.w, 1, cols);
    let bestX = 0;
    let bestY = Number.POSITIVE_INFINITY;
    for (let x = 0; x <= cols - w; x++) {
      const y = occ.dropAt(x, w, it.h);
      if (y < bestY) {
        bestY = y;
        bestX = x;
      }
    }
    occ.mark(bestX, bestY, w, it.h);
    out.push({ ...it, x: bestX, y: bestY, w });
  }
  return out;
}

/** Shelf: pack items left-to-right into rows, wrapping to a new shelf when full. */
export function shelfCompact(layout: Layout, colsInput: number): LayoutItem[] {
  const cols = Math.max(1, colsInput);
  const out: LayoutItem[] = [];
  let cursorX = 0;
  let shelfTop = 0;
  let shelfBottom = 0;
  for (const it of sortLayoutItemsByRowCol(layout)) {
    const w = clamp(it.w, 1, cols);
    if (cursorX + w > cols) {
      shelfTop = shelfBottom;
      cursorX = 0;
    }
    out.push({ ...it, x: cursorX, y: shelfTop, w });
    cursorX += w;
    shelfBottom = Math.max(shelfBottom, shelfTop + it.h);
  }
  return out;
}

export const gravityCompactor: Compactor = {
  type: null,
  allowOverlap: false,
  compact: gravityCompact,
};

export const masonryCompactor: Compactor = {
  type: null,
  allowOverlap: false,
  compact: masonryCompact,
};

export const shelfCompactor: Compactor = {
  type: null,
  allowOverlap: false,
  compact: shelfCompact,
};
