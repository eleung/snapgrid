import type { Layout, LayoutItem } from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import { gravityCompact, masonryCompact, shelfCompact } from "../compactors.js";

/** True if no two items in the layout overlap. */
function noOverlaps(layout: readonly LayoutItem[]): boolean {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      const a = layout[i] as LayoutItem;
      const b = layout[j] as LayoutItem;
      const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      if (overlap) return false;
    }
  }
  return true;
}

function bottom(layout: readonly LayoutItem[]): number {
  return layout.reduce((m, it) => Math.max(m, it.y + it.h), 0);
}

const scattered: Layout = [
  { i: "a", x: 4, y: 0, w: 2, h: 2 },
  { i: "b", x: 0, y: 3, w: 2, h: 1 },
  { i: "c", x: 3, y: 5, w: 3, h: 1 },
  { i: "d", x: 0, y: 8, w: 1, h: 2 },
];

describe("gravityCompact (top-left fill)", () => {
  it("packs all items without overlaps and pulls the first item to the origin", () => {
    const out = gravityCompact(scattered, 6);
    expect(out).toHaveLength(4);
    expect(noOverlaps(out)).toBe(true);
    // earliest item (a, lowest y) lands at the origin
    expect(out.find((it) => it.i === "a")).toMatchObject({ x: 0, y: 0 });
  });
});

describe("masonryCompact (minimize height)", () => {
  it("packs without overlaps and is no taller than gravity", () => {
    const masonry = masonryCompact(scattered, 6);
    expect(noOverlaps(masonry)).toBe(true);
    expect(bottom(masonry)).toBeLessThanOrEqual(bottom(gravityCompact(scattered, 6)));
  });

  it("balances two equal items into separate columns", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 1, h: 2 },
      { i: "b", x: 0, y: 3, w: 1, h: 2 },
    ];
    const out = masonryCompact(layout, 4);
    expect(bottom(out)).toBe(2); // side by side, not stacked
  });
});

describe("degenerate column counts", () => {
  // Regression: cols <= 0 used to spin firstFit/dropAt forever (`cols - w` < 0).
  it.each([
    ["gravity", gravityCompact],
    ["masonry", masonryCompact],
    ["shelf", shelfCompact],
  ])("%s treats cols<=0 as a single column instead of hanging", (_name, compact) => {
    const out = compact(scattered, 0);
    expect(out).toHaveLength(4);
    expect(noOverlaps(out)).toBe(true);
    for (const it of out) {
      expect(it.x).toBe(0);
      expect(it.x + it.w).toBeLessThanOrEqual(1);
    }
  });
});

describe("shelfCompact (rows)", () => {
  it("packs items into wrapped rows without overlaps", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 4, h: 1 },
      { i: "b", x: 0, y: 0, w: 3, h: 2 },
      { i: "c", x: 0, y: 0, w: 2, h: 1 },
    ];
    const out = shelfCompact(layout, 6);
    expect(noOverlaps(out)).toBe(true);
    // a (w4) + b (w3) > 6 -> b wraps to a new shelf below a
    expect(out.find((it) => it.i === "a")).toMatchObject({ x: 0, y: 0 });
    expect(out.find((it) => it.i === "b")).toMatchObject({ x: 0, y: 1 });
    // c (w2) fits on b's shelf after b (x=3)
    expect(out.find((it) => it.i === "c")).toMatchObject({ x: 3, y: 1 });
  });
});
