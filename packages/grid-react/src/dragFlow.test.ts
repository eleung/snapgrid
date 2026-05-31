import { toPositionParams } from "@snapgrid/core";
import { describe, expect, it } from "vitest";
import { type DropState, classifyDrop, receiveCell } from "./dragFlow.js";

const pp = toPositionParams(
  {
    cols: 12,
    rowHeight: 100,
    margin: [10, 10],
    containerPadding: [10, 10],
    maxRows: Number.POSITIVE_INFINITY,
  },
  1210,
);
// colWidth 90 → column pitch 100; row pitch 110.

describe("receiveCell (#1 grab offset)", () => {
  it("maps the pointer to a cell when no offset is recorded (external drop)", () => {
    expect(receiveCell({ x: 210, y: 120 }, { left: 0, top: 0 }, { x: 0, y: 0 }, 2, 2, pp)).toEqual({
      x: 2,
      y: 1,
    });
  });

  it("subtracts the grab offset so the tile's top-left (not the cursor) maps to the cell", () => {
    // Same pointer, but grabbed one full cell down-and-right within the tile:
    // the computed cell shifts back by (1 col, 1 row) vs. the no-offset case.
    expect(
      receiveCell({ x: 210, y: 120 }, { left: 0, top: 0 }, { x: 100, y: 110 }, 2, 2, pp),
    ).toEqual({ x: 1, y: 0 });
  });

  it("accounts for the grid's own client-rect origin", () => {
    expect(
      receiveCell({ x: 310, y: 230 }, { left: 100, top: 110 }, { x: 0, y: 0 }, 2, 2, pp),
    ).toEqual({ x: 2, y: 1 });
  });
});

describe("classifyDrop (#7 cross-grid lifecycle, #9 destination resolution)", () => {
  const base: DropState = {
    kind: "move",
    canceled: false,
    ownsItem: true,
    hasData: true,
    dest: "A",
    myId: "A",
  };

  it("owner dropping back in its own grid → commit-in-grid", () => {
    expect(classifyDrop(base)).toBe("commit-in-grid");
  });

  it("owner dropping into another grid → remove-source", () => {
    expect(classifyDrop({ ...base, dest: "B" })).toBe("remove-source");
  });

  it("owner dropping outside any grid → revert", () => {
    expect(classifyDrop({ ...base, dest: null })).toBe("revert");
  });

  it("destination of a cross-grid move → commit-dest (NOT an owner action)", () => {
    const destReceive: DropState = {
      kind: "move",
      canceled: false,
      ownsItem: false,
      hasData: true,
      dest: "B",
      myId: "B",
    };
    expect(classifyDrop(destReceive)).toBe("commit-dest");
    // #7: the destination commits the layout but must NOT be treated like an
    // owner finishing a drag — those are the only actions that fire onDragStop.
    expect(["commit-in-grid", "remove-source", "revert"]).not.toContain(classifyDrop(destReceive));
  });

  it("external draggable dropped in → external-drop", () => {
    expect(classifyDrop({ ...base, ownsItem: false, hasData: false, dest: "B", myId: "B" })).toBe(
      "external-drop",
    );
  });

  it("resize commits and cancels independently of move", () => {
    expect(classifyDrop({ ...base, kind: "resize" })).toBe("commit-resize");
    expect(classifyDrop({ ...base, kind: "resize", canceled: true })).toBe("cancel-resize");
    expect(classifyDrop({ ...base, canceled: true })).toBe("cancel-move");
  });

  it("does nothing for a non-owner that isn't the drop destination", () => {
    // #9: a grid only acts when it is the one gridAt() resolves to (dest === myId).
    expect(classifyDrop({ ...base, ownsItem: false, dest: "A", myId: "B" })).toBe("noop");
    // A canceled drag we don't own is also a no-op.
    expect(classifyDrop({ ...base, ownsItem: false, canceled: true })).toBe("noop");
  });
});
