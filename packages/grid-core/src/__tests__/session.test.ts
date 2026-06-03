import { describe, expect, it } from "vitest";
import {
  type DragAnchor,
  type Layout,
  type LayoutItem,
  beginDrag,
  beginReceive,
  beginResize,
  calcGridItemPosition,
  commitLayout,
  dragResize,
  dragTo,
  horizontalCompactor,
  nudge,
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
const pp = toPositionParams(grid, 1210); // column pitch 100, row pitch 110
const ctx = { positionParams: pp, compactor: verticalCompactor, cols: 12 };

function anchorFor(item: LayoutItem, pointer = { x: 0, y: 0 }): DragAnchor {
  const pos = calcGridItemPosition(pp, item.x, item.y, item.w, item.h);
  return { item, left: pos.left, top: pos.top, pointer };
}

describe("drag session", () => {
  it("beginDrag starts with the item as its own placeholder", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    const s = beginDrag([item], anchorFor(item));
    expect(s.activeId).toBe("a");
    expect(s.placeholder).toEqual(item);
  });

  it("dragTo maps a one-column-right pointer delta to the next column", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    const s = dragTo(
      beginDrag([item], anchorFor(item, { x: 200, y: 200 })),
      { x: 300, y: 200 },
      ctx,
    );
    expect(s.placeholder?.x).toBe(1);
    expect(s.placeholder?.y).toBe(0);
  });

  it("dragTo reflows other items and offsets the active tile to track the pointer", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 0, y: 4, w: 2, h: 2 },
    ];
    const b = layout[1] as LayoutItem;
    // Pointer starts at (500,500), moves up ~2 rows (2 * 110 = 220px).
    const s = dragTo(beginDrag(layout, anchorFor(b, { x: 500, y: 500 })), { x: 500, y: 280 }, ctx);
    expect(s.preview.find((it) => it.i === "b")?.y).toBe(2); // compacted against a
    expect(s.preview.find((it) => it.i === "a")?.y).toBe(0);
  });

  it("beginReceive inserts a foreign tile at the target cell and reflows", () => {
    const committed: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 2 }];
    const foreign: LayoutItem = { i: "x", x: 0, y: 0, w: 2, h: 2 };
    const s = beginReceive(committed, foreign, 2, 0, { x: 0, y: 0 }, ctx);
    expect(s.activeId).toBe("x");
    expect(s.placeholder?.i).toBe("x");
    // both the existing and the received tile are present in the preview
    expect(s.preview.map((it) => it.i).sort()).toEqual(["a", "x"]);
  });

  it("dragResize clamps a south-handle resize to the grid's maxRows", () => {
    const ppMax = toPositionParams({ ...grid, maxRows: 3 }, 1210);
    const ctxMax = { positionParams: ppMax, compactor: verticalCompactor, cols: 12 };
    const item: LayoutItem = { i: "a", x: 0, y: 1, w: 2, h: 1 };
    const rect = calcGridItemPosition(ppMax, item.x, item.y, item.w, item.h);
    const session = beginResize([item], { item, rect, pointer: { x: 0, y: 0 } }, "s");
    // Drag the south handle far past maxRows; height must be clamped to maxRows - y.
    const s = dragResize(session, { x: 0, y: 5000 }, ctxMax);
    expect(s.placeholder?.h).toBeLessThanOrEqual(2);
    expect((s.placeholder?.y ?? 0) + (s.placeholder?.h ?? 0)).toBeLessThanOrEqual(3);
  });

  it("commitLayout strips the internal `moved` flag", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 3, y: 0, w: 2, h: 2 },
    ];
    const a = layout[0] as LayoutItem;
    const s = dragTo(beginDrag(layout, anchorFor(a, { x: 100, y: 100 })), { x: 400, y: 100 }, ctx);
    const committed = commitLayout(s);
    expect(committed.every((it) => it.moved === undefined)).toBe(true);
  });

  it("nudge steps the active item one column right (keyboard drag)", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    const s = nudge(beginDrag([item], anchorFor(item)), 1, 0, ctx);
    expect(s.placeholder?.x).toBe(1);
    expect(s.placeholder?.y).toBe(0);
  });

  it("nudge clamps at the right edge (x + w never exceeds cols)", () => {
    const item: LayoutItem = { i: "a", x: 10, y: 0, w: 2, h: 2 }; // already at the wall
    const s = nudge(beginDrag([item], anchorFor(item)), 1, 0, ctx);
    expect(s.placeholder?.x).toBe(10);
  });

  it("nudge clamps at the left edge (x never goes negative)", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    const s = nudge(beginDrag([item], anchorFor(item)), -1, 0, ctx);
    expect(s.placeholder?.x).toBe(0);
  });

  it("nudge accumulates across successive steps", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    let s = beginDrag([item], anchorFor(item));
    s = nudge(s, 1, 0, ctx);
    s = nudge(s, 1, 0, ctx);
    expect(s.placeholder?.x).toBe(2);
  });

  it("nudge reflows other tiles around the moved one (no overlap)", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 2, y: 0, w: 2, h: 2 },
    ];
    const a = layout[0] as LayoutItem;
    const s = nudge(beginDrag(layout, anchorFor(a)), 1, 0, ctx);
    expect(s.placeholder?.x).toBe(1);
    expect(s.preview.map((it) => it.i).sort()).toEqual(["a", "b"]);
  });

  it("nudge leaves resize sessions untouched", () => {
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
    const rect = calcGridItemPosition(pp, item.x, item.y, item.w, item.h);
    const resizeSession = beginResize([item], { item, rect, pointer: { x: 0, y: 0 } }, "se");
    expect(nudge(resizeSession, 1, 0, ctx)).toBe(resizeSession);
  });

  it("nudge clamps the vertical step to maxRows", () => {
    const ppMax = toPositionParams({ ...grid, maxRows: 3 }, 1210);
    // Horizontal compactor leaves y free, so the maxRows clamp is observable.
    const ctxMax = { positionParams: ppMax, compactor: horizontalCompactor, cols: 12 };
    const item: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 1 };
    let s = beginDrag([item], anchorFor(item));
    for (let i = 0; i < 6; i++) s = nudge(s, 0, 1, ctxMax);
    expect((s.placeholder?.y ?? 0) + item.h).toBeLessThanOrEqual(3);
    expect(s.placeholder?.y).toBe(2);
  });

  it("nudge does not teleport a non-resting tile up on a down-step", () => {
    // Item sits at y=2 with empty space above (a non-compacted controlled layout).
    const item: LayoutItem = { i: "a", x: 0, y: 2, w: 2, h: 2 };
    const s = nudge(beginDrag([item], anchorFor(item)), 0, 1, ctx);
    expect(s.placeholder?.y).toBe(2); // no jump to the top under vertical gravity
  });
});
