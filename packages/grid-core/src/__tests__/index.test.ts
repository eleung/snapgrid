import { describe, expect, it } from "vitest";
import {
  type Layout,
  type LayoutItem,
  calcGridCellDimensions,
  calcGridItemPosition,
  calcXY,
  moveItemWithCompactor,
  toPositionParams,
  verticalCompactor,
} from "../index.js";

const grid = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
  maxRows: Number.POSITIVE_INFINITY,
};

describe("@snapgridjs/core adapter re-exports", () => {
  it("exposes react-grid-layout/core helpers", () => {
    expect(typeof calcGridCellDimensions).toBe("function");
    expect(typeof calcXY).toBe("function");
    expect(typeof verticalCompactor.compact).toBe("function");
    expect(verticalCompactor.type).toBe("vertical");
  });

  it("calcGridCellDimensions reports cell geometry", () => {
    const dims = calcGridCellDimensions({
      width: 1210,
      cols: 12,
      rowHeight: 100,
      margin: [10, 10],
      containerPadding: [10, 10],
    });
    // 1210 = 10 + 12*cell + 11*10 + 10 -> cell = 90
    expect(dims.cellWidth).toBeCloseTo(90, 5);
    expect(dims.cellHeight).toBe(100);
    expect(dims.gapX).toBe(10);
    expect(dims.offsetX).toBe(10);
  });
});

describe("geometry round-trip (toPositionParams + calcGridItemPosition + calcXY)", () => {
  it("maps a grid cell to pixels and back", () => {
    const pp = toPositionParams(grid, 1210);
    const pos = calcGridItemPosition(pp, 3, 2, 2, 1);
    const { x, y } = calcXY(pp, pos.top, pos.left, 2, 1);
    expect(x).toBe(3);
    expect(y).toBe(2);
  });
});

describe("moveItemWithCompactor (vertical)", () => {
  it("moves an item and compacts the layout upward", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 0, y: 5, w: 2, h: 2 },
    ];
    const b = layout[1] as LayoutItem;
    // Drag b up onto the same column as a; vertical compaction should stack it
    // directly beneath a (y = 2), not leave the gap.
    const next = moveItemWithCompactor(layout, b, 0, 3, {
      compactor: verticalCompactor,
      cols: 12,
    });
    const movedB = next.find((it) => it.i === "b");
    const movedA = next.find((it) => it.i === "a");
    expect(movedA?.y).toBe(0);
    expect(movedB?.y).toBe(2);
    // original layout is not mutated
    expect((layout[1] as LayoutItem).y).toBe(5);
  });
});
