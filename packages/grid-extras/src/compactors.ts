import {
  type Compactor,
  type Layout,
  type LayoutItem,
  clamp,
  sortLayoutItemsByRowCol,
} from "@snapgridjs/core";

/**
 * Custom packing styles. They report `type: null` (free-positioning from
 * react-grid-layout's perspective) and do the real packing in `compact()`, so
 * the dropped cell only influences ORDER while the algorithm decides positions.
 *
 * Like the built-in compactors, these honor `static` items: a static item keeps
 * its exact position and movable items pack *around* it (it's reserved in the
 * occupancy before packing begins). They do not honor `maxRows` (the
 * `Compactor.compact` contract takes only `cols`) — use a built-in compactor
 * when you need row capping.
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

/**
 * Reserve every `static` item's cells in a fresh occupancy so movables pack
 * around them. Statics keep their exact placement; `w` is clamped only for the
 * reservation so an out-of-range static can't corrupt the grid.
 */
function reserveStatics(layout: Layout, cols: number): Occupancy {
  const occ = new Occupancy(cols);
  for (const it of layout) {
    if (it.static) occ.mark(it.x, it.y, clamp(it.w, 1, cols), it.h);
  }
  return occ;
}

/**
 * Shared skeleton for the custom packers: reserve the static tiles, then walk the
 * movable items in row-col order and place each via `place`, marking it occupied
 * as it lands. Statics keep their exact placement — only the placement strategy
 * differs between packers.
 */
function packAroundStatics(
  layout: Layout,
  cols: number,
  place: (item: LayoutItem, w: number, occ: Occupancy) => { x: number; y: number },
): LayoutItem[] {
  const occ = reserveStatics(layout, cols);
  const out: LayoutItem[] = [];
  for (const it of sortLayoutItemsByRowCol(layout)) {
    if (it.static) {
      out.push({ ...it });
      continue;
    }
    const w = clamp(it.w, 1, cols);
    const { x, y } = place(it, w, occ);
    occ.mark(x, y, w, it.h);
    out.push({ ...it, x, y, w });
  }
  return out;
}

/** Top-left gravity: each item falls into the earliest free hole (row-major). */
export function gravityCompact(layout: Layout, colsInput: number): LayoutItem[] {
  // A grid with < 1 column is degenerate; treat it as a single column rather
  // than letting firstFit/dropAt spin forever (`cols - w` never goes >= 0).
  const cols = Math.max(1, colsInput);
  return packAroundStatics(layout, cols, (it, w, occ) => occ.firstFit(w, it.h));
}

/** Masonry: minimize height by dropping each item into its shortest column span. */
export function masonryCompact(layout: Layout, colsInput: number): LayoutItem[] {
  const cols = Math.max(1, colsInput);
  return packAroundStatics(layout, cols, (it, w, occ) => {
    let bestX = 0;
    let bestY = Number.POSITIVE_INFINITY;
    for (let x = 0; x <= cols - w; x++) {
      const y = occ.dropAt(x, w, it.h);
      if (y < bestY) {
        bestY = y;
        bestX = x;
      }
    }
    return { x: bestX, y: bestY };
  });
}

/** Shelf: pack items left-to-right into rows, wrapping to a new shelf when full. */
export function shelfCompact(layout: Layout, colsInput: number): LayoutItem[] {
  const cols = Math.max(1, colsInput);
  let cursorX = 0;
  let shelfTop = 0;
  let shelfBottom = 0;
  return packAroundStatics(layout, cols, (it, w, occ) => {
    if (cursorX + w > cols) {
      shelfTop = shelfBottom;
      cursorX = 0;
    }
    // Step over cells a static reserved on this shelf; when the row is
    // exhausted, drop to a new shelf. `occ` auto-grows so a free row always
    // exists below the statics — the loop terminates. (With no statics `occ`
    // is empty and `fits` is always true here, so this is a no-op.)
    while (!occ.fits(cursorX, shelfTop, w, it.h)) {
      cursorX++;
      if (cursorX + w > cols) {
        shelfTop = Math.max(shelfBottom, shelfTop + 1);
        shelfBottom = Math.max(shelfBottom, shelfTop);
        cursorX = 0;
      }
    }
    const placed = { x: cursorX, y: shelfTop };
    cursorX += w;
    shelfBottom = Math.max(shelfBottom, shelfTop + it.h);
    return placed;
  });
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
