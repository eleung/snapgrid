import { describe, expect, it } from "vitest";
import {
  type Layout,
  type LayoutItem,
  type ResizeHandleAxis,
  beginResize,
  calcGridItemPosition,
  dragResize,
  toPositionParams,
  verticalCompactor,
} from "./index.js";

const grid = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
  maxRows: Number.POSITIVE_INFINITY,
};
const pp = toPositionParams(grid, 1210); // column pitch 100, row pitch 110
const ctx = { positionParams: pp, compactor: verticalCompactor, cols: 12 };

function startResize(
  layout: Layout,
  item: LayoutItem,
  handle: ResizeHandleAxis,
  pointer = { x: 500, y: 500 },
) {
  const rect = calcGridItemPosition(pp, item.x, item.y, item.w, item.h);
  return beginResize(layout, { item, rect, pointer }, handle);
}

describe("resize session", () => {
  it("se handle grows width/height by whole cells, top-left anchored", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    // Drag SE handle right ~2 cols (200px) and down ~1 row (110px).
    const s = dragResize(startResize([item], item, "se"), { x: 700, y: 610 }, ctx);
    const a = s.preview.find((it) => it.i === "a");
    expect(a).toMatchObject({ x: 0, y: 0, w: 4, h: 3 });
  });

  it("west handle keeps the right edge anchored", () => {
    const item: LayoutItem = { i: "a", x: 4, y: 0, w: 4, h: 2 };
    // Drag W handle right ~2 cols -> width shrinks by 2, x increases by 2.
    const s = dragResize(startResize([item], item, "w"), { x: 700, y: 500 }, ctx);
    const a = s.preview.find((it) => it.i === "a");
    expect(a?.w).toBe(2);
    expect(a?.x).toBe(6); // right edge (x+w=8) preserved
  });

  it("respects minW/maxW constraints", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 3, h: 2, maxW: 4 };
    // Try to grow far beyond maxW.
    const s = dragResize(startResize([item], item, "e"), { x: 1500, y: 500 }, ctx);
    expect(s.preview.find((it) => it.i === "a")?.w).toBe(4);
  });

  it("reflows other items downward when an item grows into them", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 1 },
      { i: "b", x: 0, y: 1, w: 2, h: 1 },
    ];
    const a = layout[0] as LayoutItem;
    // Grow a's height by ~2 rows (220px) downward.
    const s = dragResize(startResize(layout, a, "s"), { x: 500, y: 720 }, ctx);
    expect(s.preview.find((it) => it.i === "a")?.h).toBe(3);
    expect(s.preview.find((it) => it.i === "b")?.y).toBe(3); // pushed below the taller a
  });
});
