import {
  type GridConfig,
  type Layout,
  calcGridItemPosition,
  defaultGridConfig,
  toPositionParams,
} from "@snapgridjs/core";
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { handleStyle } from "../handleStyle.js";
import { Grid, Headless, Nested, Siblings } from "./fixtures.js";

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

function itemEl(root: Element, id: string): HTMLElement {
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

// Solid propagates signal writes synchronously, so a `set*` call is the whole "rerender".

describe("GridLayout", () => {
  it("renders each layout item positioned by the engine math", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 2, h: 2 },
      { i: "b", x: 2, y: 0, w: 1, h: 1 },
    ];
    const { container } = render(() => <Grid layout={layout} width={400} />);

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

  it("renders the item content from the render-prop child", () => {
    const { container } = render(() => (
      <Grid layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400} />
    ));
    expect(itemEl(container, "a").querySelector(".content")?.textContent).toBe("a");
  });

  it("reflows reactively when the committed layout prop changes", () => {
    const [layout, setLayout] = createSignal<Layout>([{ i: "a", x: 0, y: 0, w: 1, h: 1 }]);
    const { container } = render(() => <Grid layout={layout()} width={400} />);
    expect(itemEl(container, "a").style.top).toBe(`${expectedBox(0, 0, 1, 1, 400).top}px`);

    setLayout([{ i: "a", x: 0, y: 3, w: 1, h: 1 }]);

    const moved = expectedBox(0, 3, 1, 1, 400);
    expect(itemEl(container, "a").style.top).toBe(`${moved.top}px`);
    expect(moved.top).toBeGreaterThan(0);
  });

  it("keeps a tile mounted across layout commits (tiles are keyed by `i`)", () => {
    const [layout, setLayout] = createSignal<Layout>([
      { i: "a", x: 0, y: 0, w: 1, h: 1 },
      { i: "b", x: 1, y: 0, w: 1, h: 1 },
    ]);
    const { container } = render(() => <Grid layout={layout()} width={400} />);
    const before = itemEl(container, "a");

    // A commit replaces every entry object, as a real drop does.
    setLayout([
      { i: "a", x: 2, y: 0, w: 1, h: 1 },
      { i: "b", x: 1, y: 0, w: 1, h: 1 },
    ]);

    expect(itemEl(container, "a")).toBe(before);
    expect(before.style.left).toBe(`${expectedBox(2, 0, 1, 1, 400).left}px`);
  });

  it("adds and removes tiles as the layout gains and loses items", () => {
    const [layout, setLayout] = createSignal<Layout>([{ i: "a", x: 0, y: 0, w: 1, h: 1 }]);
    const { container } = render(() => <Grid layout={layout()} width={400} />);

    setLayout([
      { i: "a", x: 0, y: 0, w: 1, h: 1 },
      { i: "b", x: 1, y: 0, w: 1, h: 1 },
    ]);
    expect(itemEl(container, "b").style.left).toBe(`${expectedBox(1, 0, 1, 1, 400).left}px`);

    setLayout([{ i: "b", x: 1, y: 0, w: 1, h: 1 }]);
    expect(container.querySelector('[data-grid-id="a"]')).toBeNull();
    expect(container.querySelectorAll(".snapgrid-item")).toHaveLength(1);
  });

  it("reflows reactively when the width changes", () => {
    const layout: Layout = [{ i: "a", x: 1, y: 0, w: 1, h: 1 }];
    const [width, setWidth] = createSignal(400);
    const { container } = render(() => <Grid layout={layout} width={width()} />);
    const narrow = itemEl(container, "a").style.width;

    setWidth(800);
    const wide = itemEl(container, "a").style.width;

    expect(Number.parseFloat(wide)).toBeGreaterThan(Number.parseFloat(narrow));
  });

  it("auto-sizes the surface height to the occupied rows", () => {
    const [layout, setLayout] = createSignal<Layout>([{ i: "a", x: 0, y: 0, w: 1, h: 1 }]);
    const { container } = render(() => <Grid layout={layout()} width={400} />);
    const surface = container.querySelector<HTMLElement>(".snapgrid");
    if (!surface) throw new Error("surface not found");
    const oneRow = Number.parseFloat(surface.style.height);
    expect(oneRow).toBeGreaterThan(0);

    setLayout([{ i: "a", x: 0, y: 0, w: 1, h: 3 }]);
    expect(Number.parseFloat(surface.style.height)).toBeGreaterThan(oneRow);
  });

  it("renders no placeholder when idle", () => {
    const { container } = render(() => (
      <Grid layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400} />
    ));
    expect(container.querySelector(".snapgrid-placeholder")).toBeNull();
  });

  it("renders the configured resize handle for resizable items", () => {
    const { container } = render(() => (
      <Grid layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400} isResizable />
    ));
    const handle = itemEl(container, "a").querySelector<HTMLElement>(".snapgrid-resize-handle--se");
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute("data-snapgrid-resize-handle")).toBe("true");
  });

  it("omits resize handles when the grid is not resizable", () => {
    const { container } = render(() => (
      <Grid layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400} isResizable={false} />
    ));
    expect(itemEl(container, "a").querySelector(".snapgrid-resize-handle")).toBeNull();
  });

  it("omits resize handles for a locked static item", () => {
    const { container } = render(() => (
      <Grid layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1, static: true }]} width={400} />
    ));
    expect(itemEl(container, "a").querySelector(".snapgrid-resize-handle")).toBeNull();
  });
});

describe("provider structure", () => {
  it("shares one manager across a nested grid (no duplicate provider)", () => {
    const { container } = render(() => (
      <Nested
        outer={[
          { i: "host", x: 0, y: 0, w: 2, h: 2 },
          { i: "o2", x: 2, y: 0, w: 1, h: 1 },
        ]}
        inner={[{ i: "n1", x: 0, y: 0, w: 1, h: 1 }]}
      />
    ));
    // Both outer tiles and the inner tile resolve their controllers and render; a broken
    // dedupe would throw "no grid found" for the inner tile.
    expect(container.querySelector('[data-grid-id="host"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="o2"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="n1"]')).not.toBeNull();
  });

  it("shares one manager across sibling grids in a SnapGridGroup", () => {
    const { container } = render(() => (
      <Siblings
        left={[{ i: "l1", x: 0, y: 0, w: 1, h: 1 }]}
        right={[{ i: "r1", x: 0, y: 0, w: 1, h: 1 }]}
      />
    ));
    expect(container.querySelector('[data-grid-id="l1"]')).not.toBeNull();
    expect(container.querySelector('[data-grid-id="r1"]')).not.toBeNull();
  });
});

describe("headless hooks", () => {
  it("useGridContainer + useGridItem position tiles via the controller", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const { container } = render(() => <Headless layout={layout} width={400} />);

    const surface = container.querySelector<HTMLElement>(".headless-surface");
    expect(surface?.getAttribute("data-group")).toBeTruthy();

    const tile = container.querySelector<HTMLElement>('.headless-tile[data-grid-id="a"]');
    expect(tile).not.toBeNull();
    const a = expectedBox(0, 0, 2, 1, 400);
    expect(tile?.style.left).toBe(`${a.left}px`);
    expect(tile?.style.width).toBe(`${a.width}px`);
  });

  it("leaves a vertical swipe on a tile and on a handle to the browser to scroll", () => {
    const { container } = render(() => (
      <Headless layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400} />
    ));
    // `touch-action: none` would make every swipe that starts on a tile — or a handle —
    // inert; the touch hold (see buildItemSensors) is what tells a scroll from a drag.
    expect(
      container.querySelector<HTMLElement>('.headless-tile[data-grid-id="a"]')?.dataset.touchAction,
    ).toBe("pan-y");
    expect(handleStyle("se")["touch-action"]).toBe("pan-y");
  });

  it("keeps touch-action: none on a tile when the touch hold is off", () => {
    const { container } = render(() => (
      <Headless
        layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]}
        width={400}
        dragConfig={{ touchHold: 0 }}
      />
    ));
    // Touch now arms on `threshold` movement like the mouse, so the tile keeps owning the
    // gesture — `pan-y` would scroll the page and drag the tile at the same time.
    expect(
      container.querySelector<HTMLElement>('.headless-tile[data-grid-id="a"]')?.dataset.touchAction,
    ).toBe("none");
  });
});
