import type { Layout } from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { Grid } from "./fixtures.js";

// Server render must not touch the DOM or throw: every browser-only step (the tile's
// WAAPI FLIP, the ResizeObserver, element refs, attaching the drag engine) is guarded or
// lives in a post-flush watcher, which Vue skips during SSR. The markup should still
// carry engine-computed geometry so the client hydrates onto the same boxes.
//
// This file runs in the `vue-ssr` project (`environment: "node"`), NOT jsdom — under
// jsdom `document`/`window` exist and the no-DOM contract would be unenforceable. The
// guard below fails the suite if it is ever run in a DOM environment by mistake.

const LAYOUT: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 1, h: 1 },
];

describe("server rendering", () => {
  it("runs with no DOM globals, so the assertions below mean something", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
  });

  it("renders a grid to a string without touching the DOM", async () => {
    const app = createSSRApp(Grid, { layout: LAYOUT, width: 400 });
    const html = await renderToString(app);

    expect(html).toContain('class="snapgrid"');
    expect(html).toContain('data-grid-id="a"');
    expect(html).toContain('data-grid-id="b"');
  });

  it("positions items server-side so hydration lands on the same geometry", async () => {
    const app = createSSRApp(Grid, { layout: LAYOUT, width: 400 });
    const html = await renderToString(app);

    // The surface is auto-sized and tiles carry absolute left/top from the engine math,
    // not a post-mount measurement.
    expect(html).toMatch(/position:\s*relative/);
    expect(html).toMatch(/left:\s*\d/);
    expect(html).toMatch(/top:\s*\d/);
  });
});
