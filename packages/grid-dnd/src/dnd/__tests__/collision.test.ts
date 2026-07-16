import { afterEach, describe, expect, it } from "vitest";
import {
  SNAPGRID_DROPPABLE_ATTR,
  SNAPGRID_GRID_ATTR,
  gridCollisionDetector,
  nestedDepth,
  nestedDropCollisionDetector,
} from "../collision.js";

afterEach(() => {
  document.body.innerHTML = "";
});

/**
 * A minimal fake collision input: `pointerIntersection` (which both detectors
 * wrap) needs only a current pointer plus a droppable `shape` that contains it,
 * and our detectors read the droppable's `element` to measure depth.
 */
function fakeInput(element: Element | null, contains = true) {
  return {
    dragOperation: { position: { current: { x: 3, y: 4 } } },
    droppable: {
      id: "zone",
      element,
      shape: { containsPoint: () => contains, center: { x: 0, y: 0 } },
    },
    // biome-ignore lint/suspicious/noExplicitAny: hand-rolled stand-in for dnd-kit's input.
  } as any;
}

describe("nestedDepth", () => {
  it("is 0 for a top-level surface (no marked ancestors)", () => {
    document.body.innerHTML = `<div ${SNAPGRID_GRID_ATTR}></div>`;
    expect(nestedDepth(document.querySelector(`[${SNAPGRID_GRID_ATTR}]`))).toBe(0);
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
    expect(nestedDepth(document.getElementById("outer"))).toBe(0);
    expect(nestedDepth(document.getElementById("inner"))).toBe(1);
    expect(nestedDepth(document.getElementById("innermost"))).toBe(2);
  });

  it("counts drop-zone markers as well as grids", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div class="tile">
          <div ${SNAPGRID_DROPPABLE_ATTR} id="zoneA">
            <div ${SNAPGRID_DROPPABLE_ATTR} id="zoneB"></div>
          </div>
        </div>
      </div>`;
    expect(nestedDepth(document.getElementById("grid"))).toBe(0);
    expect(nestedDepth(document.getElementById("zoneA"))).toBe(1); // grid
    expect(nestedDepth(document.getElementById("zoneB"))).toBe(2); // grid + zoneA
  });

  it("does not count the element's own marker — only ancestors", () => {
    // A marker earns depth for the marked element's DESCENDANTS, not for itself,
    // so a marked zone and a plain sibling at the same DOM level measure the same.
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div class="tile"><div ${SNAPGRID_DROPPABLE_ATTR} id="marked"></div></div>
        <div class="tile"><div id="plain"></div></div>
      </div>`;
    expect(nestedDepth(document.getElementById("marked"))).toBe(1); // grid only
    expect(nestedDepth(document.getElementById("plain"))).toBe(1); // grid only — same
  });

  it("returns 0 for a missing element", () => {
    expect(nestedDepth(null)).toBe(0);
    expect(nestedDepth(undefined)).toBe(0);
  });
});

describe("nestedDropCollisionDetector", () => {
  it("returns null when the pointer is not inside the drop zone", () => {
    document.body.innerHTML = `<div ${SNAPGRID_DROPPABLE_ATTR} id="zone"></div>`;
    const el = document.getElementById("zone");
    expect(nestedDropCollisionDetector(fakeInput(el, /* contains */ false))).toBeNull();
  });

  it("outranks the grid it sits inside (drop zone wins)", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div class="tile"><div ${SNAPGRID_DROPPABLE_ATTR} id="zone"></div></div>
      </div>`;
    const gridEl = document.getElementById("grid");
    const zoneEl = document.getElementById("zone");
    const gridHit = gridCollisionDetector(fakeInput(gridEl));
    const zoneHit = nestedDropCollisionDetector(fakeInput(zoneEl));
    expect(gridHit?.priority).toBe(10); // grid at depth 0
    expect(zoneHit?.priority).toBe(11); // zone counts the grid ancestor
    expect(zoneHit!.priority).toBeGreaterThan(gridHit!.priority);
  });

  it("ranks a nested drop zone above its parent drop zone (innermost wins)", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div ${SNAPGRID_DROPPABLE_ATTR} id="outerZone">
          <div ${SNAPGRID_DROPPABLE_ATTR} id="innerZone"></div>
        </div>
      </div>`;
    const outer = nestedDropCollisionDetector(fakeInput(document.getElementById("outerZone")));
    const inner = nestedDropCollisionDetector(fakeInput(document.getElementById("innerZone")));
    expect(outer?.priority).toBe(11); // grid
    expect(inner?.priority).toBe(12); // grid + outerZone
  });

  it("makes a leaf zone outrank its grid even without its own marker", () => {
    // The detector alone suffices for a leaf zone: the grid is a marked ancestor,
    // so the zone ranks one deeper (11 > 10) whether or not it carries the marker.
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div class="tile"><div id="zone"></div></div>
      </div>`;
    expect(nestedDropCollisionDetector(fakeInput(document.getElementById("zone")))?.priority).toBe(
      11,
    );
  });

  it("ties a child zone with its parent when the intermediate parent is unmarked", () => {
    // An unmarked intermediate adds no boundary, so parent and child both count only
    // the grid — a tie. This is why each nested boundary must carry the marker.
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="grid">
        <div id="parent"><div ${SNAPGRID_DROPPABLE_ATTR} id="child"></div></div>
      </div>`;
    const parent = nestedDropCollisionDetector(fakeInput(document.getElementById("parent")));
    const child = nestedDropCollisionDetector(fakeInput(document.getElementById("child")));
    expect(parent?.priority).toBe(11);
    expect(child?.priority).toBe(11); // tie — parent needs the marker to rank the child above it
  });
});

describe("gridCollisionDetector", () => {
  it("boosts an inner grid above its outer grid", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="outer">
        <div class="tile"><div ${SNAPGRID_GRID_ATTR} id="inner"></div></div>
      </div>`;
    const outer = gridCollisionDetector(fakeInput(document.getElementById("outer")));
    const inner = gridCollisionDetector(fakeInput(document.getElementById("inner")));
    expect(outer?.priority).toBe(10);
    expect(inner?.priority).toBe(11);
  });

  it("counts an enclosing drop zone too, so a grid inside one ranks deeper", () => {
    document.body.innerHTML = `
      <div ${SNAPGRID_GRID_ATTR} id="outer">
        <div ${SNAPGRID_DROPPABLE_ATTR}>
          <div ${SNAPGRID_GRID_ATTR} id="inner"></div>
        </div>
      </div>`;
    // outer grid (0) < enclosing drop zone (1) < inner grid (2): strict innermost.
    expect(gridCollisionDetector(fakeInput(document.getElementById("inner")))?.priority).toBe(12);
  });
});
