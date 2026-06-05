import { afterEach, describe, expect, it } from "vitest";
import { SNAPGRID_GRID_ATTR, gridDepth } from "../collision.js";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("gridDepth", () => {
  it("is 0 for a top-level grid (no grid ancestors)", () => {
    document.body.innerHTML = `<div ${SNAPGRID_GRID_ATTR}></div>`;
    const grid = document.querySelector(`[${SNAPGRID_GRID_ATTR}]`);
    expect(gridDepth(grid)).toBe(0);
  });

  it("counts each ancestor grid container (innermost is deepest)", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="outer">
        <div class="tile">
          <div ${SNAPGRID_GRID_ATTR} id="inner">
            <div class="tile">
              <div ${SNAPGRID_GRID_ATTR} id="innermost"></div>
            </div>
          </div>
        </div>
      </div>`;
    expect(gridDepth(document.getElementById("outer"))).toBe(0);
    expect(gridDepth(document.getElementById("inner"))).toBe(1);
    expect(gridDepth(document.getElementById("innermost"))).toBe(2);
  });

  it("returns 0 for a missing element", () => {
    expect(gridDepth(null)).toBe(0);
    expect(gridDepth(undefined)).toBe(0);
  });
});
