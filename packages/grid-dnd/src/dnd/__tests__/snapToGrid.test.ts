import { type PositionParams, toPositionParams } from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import { SnapToGrid } from "../snapToGrid.js";

// colWidth 90 → column step 100; row step 110.
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

function snap(
  transform: { x: number; y: number },
  ppOverride: PositionParams = pp,
  enabled = true,
) {
  const mod = new SnapToGrid(null as never, {
    getPositionParams: () => ppOverride,
    isEnabled: () => enabled,
  });
  return mod.apply({ transform } as never);
}

describe("SnapToGrid modifier", () => {
  it("quantizes the transform to whole cell steps (col 100, row 110)", () => {
    expect(snap({ x: 95, y: 60 })).toEqual({ x: 100, y: 110 }); // nearest cell
    expect(snap({ x: 140, y: 0 })).toEqual({ x: 100, y: 0 }); // 1.4 → 1 step
    expect(snap({ x: 250, y: 220 })).toEqual({ x: 300, y: 220 }); // 2.5 → 3; exactly 2 rows
    expect(snap({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("is a no-op when snapping is disabled (returns the raw transform)", () => {
    const t = { x: 95, y: 60 };
    expect(snap(t, pp, false)).toBe(t); // same reference, untouched
  });

  it("guards degenerate geometry (non-positive cell step → raw transform)", () => {
    const tiny = toPositionParams(
      {
        cols: 12,
        rowHeight: 100,
        margin: [10, 10],
        containerPadding: [10, 10],
        maxRows: Number.POSITIVE_INFINITY,
      },
      0, // width 0 → negative column width → non-positive step
    );
    const t = { x: 95, y: 60 };
    expect(snap(t, tiny)).toBe(t);
  });
});
