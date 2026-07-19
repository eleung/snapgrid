import {
  type GridConfig,
  type Layout,
  calcGridItemPosition,
  defaultGridConfig,
  toPositionParams,
} from "@snapgridjs/core";
import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Grid from "./fixtures/Grid.svelte";
import Headless from "./fixtures/Headless.svelte";
import Nested from "./fixtures/Nested.svelte";
import Siblings from "./fixtures/Siblings.svelte";

const GRID_CONFIG: Partial<GridConfig> = {
  cols: 4,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [0, 0],
};

/** Expected pixel box for a layout cell, using the same math the engine uses. */
function expectedBox(x: number, y: number, w: number, h: number, width: number) {
  const pp = toPositionParams({ ...defaultGridConfig, ...GRID_CONFIG }, width);
  return calcGridItemPosition(pp, x, y, w, h);
}

function itemEl(root: HTMLElement, id: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(`.snapgrid-item[data-grid-id="${id}"]`);
  if (!el) throw new Error(`item ${id} not found`);
  return el;
}

function box(el: HTMLElement) {
  return {
    left: el.style.left,
    top: el.style.top,
    width: el.style.width,
    height: el.style.height,
  };
}

describe("GridLayout", () => {
  it("renders each layout item positioned by the engine math", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 2, y: 0, w: 1, h: 1 },
    ];
    const { container } = render(Grid, { props: { layout, width: 400 } });

    expect(container.querySelectorAll(".snapgrid-item")).toHaveLength(2);

    const a = expectedBox(0, 0, 2, 2, 400);
    expect(box(itemEl(container, "a"))).toEqual({
      left: `${a.left}px`,
      top: `${a.top}px`,
      width: `${a.width}px`,
      height: `${a.height}px`,
    });

    const b = expectedBox(2, 0, 1, 1, 400);
    expect(itemEl(container, "b").style.left).toBe(`${b.left}px`);
    // Wider item spans more columns.
    expect(a.width).toBeGreaterThan(b.width);
  });

  it("reflows reactively when the committed layout prop changes", async () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 1, h: 1 }];
    const { container, rerender } = render(Grid, { props: { layout, width: 400 } });
    expect(itemEl(container, "a").style.top).toBe(`${expectedBox(0, 0, 1, 1, 400).top}px`);

    await rerender({ layout: [{ i: "a", x: 0, y: 3, w: 1, h: 1 }], width: 400 });

    const moved = expectedBox(0, 3, 1, 1, 400);
    expect(itemEl(container, "a").style.top).toBe(`${moved.top}px`);
    expect(moved.top).toBeGreaterThan(0);
  });

  it("reflows reactively when the width changes", async () => {
    const layout: Layout = [{ i: "a", x: 1, y: 0, w: 1, h: 1 }];
    const { container, rerender } = render(Grid, { props: { layout, width: 400 } });
    const narrow = itemEl(container, "a").style.width;

    await rerender({ layout, width: 800 });
    const wide = itemEl(container, "a").style.width;

    expect(Number.parseFloat(wide)).toBeGreaterThan(Number.parseFloat(narrow));
  });

  it("auto-sizes the surface height to the occupied rows", async () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 1, h: 1 }];
    const { container, rerender } = render(Grid, { props: { layout, width: 400 } });
    const surface = container.querySelector<HTMLElement>(".snapgrid");
    if (!surface) throw new Error("surface not found");
    const oneRow = Number.parseFloat(surface.style.height);
    expect(oneRow).toBeGreaterThan(0);

    await rerender({ layout: [{ i: "a", x: 0, y: 0, w: 1, h: 3 }], width: 400 });
    expect(Number.parseFloat(surface.style.height)).toBeGreaterThan(oneRow);
  });

  it("renders no placeholder when idle", () => {
    const { container } = render(Grid, {
      props: { layout: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }], width: 400 },
    });
    expect(container.querySelector(".snapgrid-placeholder")).toBeNull();
  });

  it("renders the configured resize handle for resizable items", () => {
    const { container } = render(Grid, {
      props: { layout: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }], width: 400, isResizable: true },
    });
    const handle = itemEl(container, "a").querySelector<HTMLElement>(".snapgrid-resize-handle--se");
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute("data-snapgrid-resize-handle")).toBe("true");
  });

  it("omits resize handles when the grid is not resizable", () => {
    const { container } = render(Grid, {
      props: { layout: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }], width: 400, isResizable: false },
    });
    expect(itemEl(container, "a").querySelector(".snapgrid-resize-handle")).toBeNull();
  });

  it("omits resize handles for a locked static item", () => {
    const { container } = render(Grid, {
      props: { layout: [{ i: "a", x: 0, y: 0, w: 1, h: 1, static: true }], width: 400 },
    });
    expect(itemEl(container, "a").querySelector(".snapgrid-resize-handle")).toBeNull();
  });
});

describe("provider structure", () => {
  it("shares one manager across a nested grid (no duplicate provider)", () => {
    const { container } = render(Nested, {
      props: {
        outer: [
          { i: "host", x: 0, y: 0, w: 2, h: 2 },
          { i: "o2", x: 2, y: 0, w: 1, h: 1 },
        ],
        inner: [{ i: "n1", x: 0, y: 0, w: 1, h: 1 }],
      },
    });
    // Both outer tiles and the inner tile resolve their controllers and render;
    // a broken dedupe would throw "no grid found" for the inner tile.
    expect(container.querySelector('[data-grid-id="host"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="o2"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="n1"]')).not.toBeNull();
  });

  it("shares one manager across sibling grids in a SnapGridGroup", () => {
    const { container } = render(Siblings, {
      props: {
        left: [{ i: "l1", x: 0, y: 0, w: 1, h: 1 }],
        right: [{ i: "r1", x: 0, y: 0, w: 1, h: 1 }],
      },
    });
    expect(container.querySelector('[data-grid-id="l1"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="r1"]')).not.toBeNull();
  });
});

describe("headless factories", () => {
  it("createGridContainer + createGridItem position tiles via the controller", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const { container } = render(Headless, { props: { layout, width: 400 } });

    const surface = container.querySelector<HTMLElement>(".headless-surface");
    expect(surface?.getAttribute("data-group")).toBeTruthy();

    const tile = container.querySelector<HTMLElement>('.headless-tile[data-grid-id="a"]');
    expect(tile).not.toBeNull();
    const a = expectedBox(0, 0, 2, 1, 400);
    expect(tile?.style.left).toBe(`${a.left}px`);
    expect(tile?.style.width).toBe(`${a.width}px`);
  });
});
