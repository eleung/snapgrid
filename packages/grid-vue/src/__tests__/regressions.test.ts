import type { ResponsiveLayouts } from "@snapgridjs/core";
import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import {
  ResponsiveGridLayout,
  SnapGridGroup,
  resolveController,
  useContainerWidth,
} from "../index.js";

describe("useContainerWidth", () => {
  // Vue invokes a function ref on EVERY patch, not only when the element changes. If
  // `setRef` did the observing itself, each render would disconnect and rebuild the
  // ResizeObserver and force a synchronous layout via getBoundingClientRect — during a
  // drag, once per commit. Observation must be keyed to element identity instead.
  it("builds the ResizeObserver once across re-renders, not once per render", async () => {
    let constructed = 0;
    class SpyResizeObserver {
      constructor(_cb: unknown) {
        constructed += 1;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = SpyResizeObserver as unknown as typeof ResizeObserver;

    try {
      const Host = defineComponent({
        props: { n: { type: Number, required: true } },
        setup(props) {
          const { setRef } = useContainerWidth();
          return () => h("div", { ref: setRef }, String(props.n));
        },
      });

      const { rerender } = render(Host, { props: { n: 1 } });
      await rerender({ n: 2 });
      await rerender({ n: 3 });

      expect(constructed).toBe(1);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });
});

describe("ResponsiveGridLayout", () => {
  // `GridLayout` declares `id` as a PROP, so an `id` fallthrough attribute would be
  // consumed as the grid's droppable/registry key — silently making two responsive grids
  // in one group collide on the same key.
  it("does not let an `id` attribute become the grid's registry key", () => {
    const layouts: ResponsiveLayouts = { lg: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }] };

    // Sibling rendered after the grid, so the grid has already registered by the time
    // this resolves.
    const Probe = defineComponent({
      setup() {
        let registered = true;
        try {
          resolveController("dashboard");
        } catch {
          registered = false;
        }
        return () => h("div", { "data-registered": String(registered) });
      },
    });

    const Host = defineComponent({
      setup() {
        return () =>
          h(SnapGridGroup, null, {
            default: () => [
              h(
                ResponsiveGridLayout,
                { id: "dashboard", width: 1400, layouts },
                { item: () => h("div") },
              ),
              h(Probe),
            ],
          });
      },
    });

    const { container } = render(Host);
    expect(container.querySelector("[data-registered]")?.getAttribute("data-registered")).toBe(
      "false",
    );
  });
});
