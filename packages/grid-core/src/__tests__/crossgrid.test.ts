import { describe, expect, it } from "vitest";
import {
  type Layout,
  type LayoutItem,
  insertItemWithCompactor,
  removeItemWithCompactor,
  verticalCompactor,
} from "../index.js";

const opts = { compactor: verticalCompactor, cols: 12 };

describe("removeItemWithCompactor", () => {
  it("removes the item and compacts the remainder", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 0, y: 2, w: 2, h: 2 },
      { i: "c", x: 0, y: 4, w: 2, h: 2 },
    ];
    const next = removeItemWithCompactor(layout, "b", opts);
    expect(next.find((it) => it.i === "b")).toBeUndefined();
    expect(next).toHaveLength(2);
    // c compacts up into b's freed space.
    expect(next.find((it) => it.i === "c")?.y).toBe(2);
    // original untouched
    expect(layout).toHaveLength(3);
  });
});

describe("insertItemWithCompactor", () => {
  it("adds a foreign item at the target cell and packs the layout", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 2 }];
    const foreign: LayoutItem = { i: "X", x: 0, y: 0, w: 2, h: 1 };
    const next = insertItemWithCompactor(layout, foreign, 0, 5, opts);
    const x = next.find((it) => it.i === "X");
    expect(x).toBeDefined();
    expect(next).toHaveLength(2);
    // dropped at y=5 but vertical compaction settles it directly under a.
    expect(x?.y).toBe(2);
    expect(x?.w).toBe(2);
  });

  it("inserts into an occupied row, pushing the occupant down (e.g. the top row)", () => {
    // A foreign tile dropped on an occupied cell must take it and displace the
    // occupant — not get stacked below it. Guards the cross-grid/nested receive
    // bug where a received tile could never land in an occupied top row.
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 6, h: 1 }];
    const foreign: LayoutItem = { i: "X", x: 0, y: 0, w: 2, h: 1 };
    const next = insertItemWithCompactor(layout, foreign, 0, 0, opts);
    expect(next.find((it) => it.i === "X")?.y).toBe(0); // lands in the top row
    expect(next.find((it) => it.i === "a")?.y).toBe(1); // occupant pushed down
  });

  it("does not duplicate an item that already exists", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 2, y: 0, w: 2, h: 2 },
    ];
    const next = insertItemWithCompactor(layout, layout[1] as LayoutItem, 0, 4, opts);
    expect(next.filter((it) => it.i === "b")).toHaveLength(1);
  });
});
