import type { GridConfig, Layout, LayoutItem } from "@snapgridjs/core";
import type { Accessor, JSX } from "solid-js";
import { createComponent } from "solid-js";
import { renderToString, ssrElement } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { GridLayout } from "../index.js";

// Server render must not touch the DOM or throw: every browser-only step (the tile's
// WAAPI FLIP, the ResizeObserver, element refs, attaching the drag engine) lives in a
// `createEffect` or a ref, neither of which runs during SSR. The markup should still carry
// engine-computed geometry (published from a `createComputed`, which does run) so the
// client hydrates onto the same boxes.
//
// This file runs in the `solid-ssr` project (`environment: "node"`, no Solid compiler),
// NOT jsdom — so solid-js resolves to its server build, as under SolidStart, and the no-DOM
// contract is enforceable. Hence no JSX here: the fixture is built from the same
// `createComponent` / `ssrElement` calls the server compiler would emit.

const LAYOUT: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 1, h: 1 },
];

const SMALL_GRID: Partial<GridConfig> = {
  cols: 4,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [0, 0],
};

function renderGrid(): string {
  return renderToString(() =>
    createComponent(GridLayout, {
      layout: LAYOUT,
      width: 400,
      gridConfig: SMALL_GRID,
      // `ssrElement` is typed as its server string node; at runtime it is what server JSX
      // compiles to.
      children: (item: Accessor<LayoutItem>) =>
        ssrElement("div", { class: "content" }, () => item().i, false) as unknown as JSX.Element,
    }),
  );
}

describe("server rendering", () => {
  it("runs with no DOM globals, so the assertions below mean something", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
  });

  it("renders a grid to a string without touching the DOM", () => {
    const html = renderGrid();

    // Solid's server renderer pads class lists with a trailing space.
    expect(html).toMatch(/class="snapgrid\s*"/);
    expect(html).toContain('data-grid-id="a"');
    expect(html).toContain('data-grid-id="b"');
    expect(html).toMatch(/class="content\s*"[^>]*>a</);
  });

  it("positions items server-side so hydration lands on the same geometry", () => {
    const html = renderGrid();

    // The surface is auto-sized and tiles carry absolute left/top from the engine math,
    // not a post-mount measurement.
    expect(html).toMatch(/position:\s*relative/);
    expect(html).toMatch(/height:\s*\d/);
    expect(html).toMatch(/left:\s*\d/);
    expect(html).toMatch(/top:\s*\d/);
  });
});
