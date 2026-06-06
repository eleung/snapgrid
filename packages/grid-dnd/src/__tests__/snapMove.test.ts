import {
  type Layout,
  type LayoutItem,
  defaultGridConfig,
  toPositionParams,
  verticalCompactor,
} from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import { type SnapMoveContext, type SnapMoveEvent, snapMove } from "../snapMove.js";

const pp = toPositionParams(
  { ...defaultGridConfig, cols: 12, rowHeight: 100, margin: [10, 10], containerPadding: [10, 10] },
  1210,
);
const ctx = (extra?: Partial<SnapMoveContext>): SnapMoveContext => ({
  positionParams: pp,
  compactor: verticalCompactor,
  gridRect: { left: 0, top: 0 },
  ...extra,
});

function ev(source: SnapMoveEvent["operation"]["source"], pointer: { x: number; y: number }) {
  return {
    operation: { source, target: null, position: { current: pointer } },
  } satisfies SnapMoveEvent;
}

describe("snapMove", () => {
  it("inserts a foreign source (no snapgrid payload) at the pointer cell, using defaultItem size", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev({ id: "new" }, { x: 500, y: 250 }),
      ctx({ defaultItem: { w: 2, h: 2 } }),
    );
    const inserted = next.find((it) => it.i === "new");
    expect(inserted).toBeDefined();
    expect(inserted).toMatchObject({ w: 2, h: 2 });
    expect(next.some((it) => it.i === "a")).toBe(true); // existing tile kept
  });

  it("moves an existing tile (from its snapgrid move payload) to the pointer cell, preserving its size", () => {
    const a: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 1 };
    const layout: Layout = [a, { i: "b", x: 2, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev(
        { id: "a", data: { snapGrid: { kind: "move", itemId: "a", item: a, group: "g" } } },
        { x: 600, y: 260 },
      ),
      ctx(),
    );
    const moved = next.find((it) => it.i === "a");
    expect(moved).toBeDefined();
    expect(moved?.w).toBe(2); // size from the payload, not the default
    expect((moved?.x ?? 0) + (moved?.y ?? 0)).toBeGreaterThan(0); // left the origin
    expect(next.some((it) => it.i === "b")).toBe(true);
  });

  it("displaces the occupant when inserting into an occupied cell (compaction)", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev({ id: "x" }, { x: 2, y: 2 }), // top-left → cell (0,0), where "a" sits
      ctx({ defaultItem: { w: 2, h: 1 } }),
    );
    const x = next.find((it) => it.i === "x");
    const a = next.find((it) => it.i === "a");
    expect(x).toMatchObject({ x: 0, y: 0 }); // the dropped item takes the top-left cell
    expect(a?.y ?? 0).toBeGreaterThan(0); // the occupant is pushed down, not overlapped
  });

  it("returns the layout unchanged when there is no source", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    expect(snapMove(layout, ev(null, { x: 0, y: 0 }), ctx())).toBe(layout);
  });
});
