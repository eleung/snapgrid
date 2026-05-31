import { describe, expect, it } from "vitest";
import { createGridRegistry } from "./grouping.js";

function rect(left: number, top: number, w: number, h: number): DOMRect {
  return {
    left,
    top,
    width: w,
    height: h,
    right: left + w,
    bottom: top + h,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("grid registry", () => {
  it("resolves which registered grid contains a point", () => {
    const reg = createGridRegistry();
    reg.register("left", () => rect(0, 0, 100, 100));
    reg.register("right", () => rect(120, 0, 100, 100));
    expect(reg.gridAt({ x: 50, y: 50 })).toBe("left");
    expect(reg.gridAt({ x: 150, y: 50 })).toBe("right");
    expect(reg.gridAt({ x: 110, y: 50 })).toBeNull(); // in the gap
  });

  it("stops resolving a grid after it unregisters", () => {
    const reg = createGridRegistry();
    const unregister = reg.register("a", () => rect(0, 0, 100, 100));
    expect(reg.gridAt({ x: 10, y: 10 })).toBe("a");
    unregister();
    expect(reg.gridAt({ x: 10, y: 10 })).toBeNull();
  });

  it("ignores grids whose rect is unavailable", () => {
    const reg = createGridRegistry();
    reg.register("a", () => null);
    expect(reg.gridAt({ x: 10, y: 10 })).toBeNull();
  });

  it("resolves overlapping grids to the first registered, deterministically (#9)", () => {
    // overMe() now delegates to gridAt(), so the move-phase preview and the
    // drop-phase commit ask the SAME oracle — overlapping grids can't disagree.
    const reg = createGridRegistry();
    reg.register("under", () => rect(0, 0, 200, 200));
    reg.register("over", () => rect(50, 50, 200, 200));
    // A point inside both rects always resolves to the first-registered grid.
    expect(reg.gridAt({ x: 100, y: 100 })).toBe("under");
    expect(reg.gridAt({ x: 100, y: 100 })).toBe("under"); // stable across calls
  });

  it("tracks the active drag's grab offset (#1), defaulting to zero", () => {
    const reg = createGridRegistry();
    expect(reg.getGrabOffset()).toEqual({ x: 0, y: 0 });
    reg.setGrabOffset({ x: 12, y: 34 });
    expect(reg.getGrabOffset()).toEqual({ x: 12, y: 34 });
    reg.setGrabOffset(null);
    expect(reg.getGrabOffset()).toEqual({ x: 0, y: 0 });
  });
});
