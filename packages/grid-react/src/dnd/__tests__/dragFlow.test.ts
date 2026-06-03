import { toPositionParams } from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import {
  type DropState,
  arrowStep,
  classifyDrop,
  dropDestination,
  receiveCell,
} from "../dragFlow.js";

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

describe("arrowStep (keyboard drag)", () => {
  it("maps the four arrows to one-cell deltas", () => {
    expect(arrowStep("ArrowLeft")).toEqual([-1, 0]);
    expect(arrowStep("ArrowRight")).toEqual([1, 0]);
    expect(arrowStep("ArrowUp")).toEqual([0, -1]);
    expect(arrowStep("ArrowDown")).toEqual([0, 1]);
  });

  it("returns null for keys snapgrid doesn't own (drop/cancel/anything else)", () => {
    // Enter/Space drop and Escape cancel fall through to dnd-kit's KeyboardSensor.
    for (const key of ["Enter", " ", "Escape", "Tab", "a", "ArrowupTypo"]) {
      expect(arrowStep(key)).toBeNull();
    }
  });
});

describe("dropDestination (#7 keyboard is in-grid only)", () => {
  it("a keyboard drop always commits in-grid, ignoring any pointer target", () => {
    expect(dropDestination({ keyboard: true, targetId: "other", myId: "me" })).toBe("me");
    expect(dropDestination({ keyboard: true, targetId: null, myId: "me" })).toBe("me");
    // Pairs with classifyDrop: a keyboard drop resolves dest === myId, so even
    // while the pointer-target says "B" the owner commits in-grid, not cross-grid.
    expect(
      classifyDrop({
        kind: "move",
        canceled: false,
        ownsItem: true,
        hasData: true,
        dest: dropDestination({ keyboard: true, targetId: "B", myId: "A" }),
        myId: "A",
      }),
    ).toBe("commit-in-grid");
  });

  it("a pointer drop uses the collision target id (stringified), or null", () => {
    expect(dropDestination({ keyboard: false, targetId: "g2", myId: "me" })).toBe("g2");
    expect(dropDestination({ keyboard: false, targetId: 42, myId: "me" })).toBe("42");
    expect(dropDestination({ keyboard: false, targetId: null, myId: "me" })).toBeNull();
    expect(dropDestination({ keyboard: false, targetId: undefined, myId: "me" })).toBeNull();
  });
});
