import type { ResponsiveLayouts } from "@snapgridjs/core";
import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import Responsive from "./fixtures/Responsive.svelte";

const LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "a", x: 0, y: 0, w: 2, h: 1 },
    { i: "b", x: 2, y: 0, w: 2, h: 1 },
  ],
  xxs: [
    { i: "a", x: 0, y: 0, w: 1, h: 1 },
    { i: "b", x: 1, y: 0, w: 1, h: 1 },
  ],
};

function itemWidth(root: HTMLElement, id: string): number {
  const el = root.querySelector<HTMLElement>(`.snapgrid-item[data-grid-id="${id}"]`);
  if (!el) throw new Error(`item ${id} not found`);
  return Number.parseFloat(el.style.width);
}

describe("ResponsiveGridLayout", () => {
  it("resolves the active breakpoint's layout and renders its items", () => {
    const { container } = render(Responsive, { props: { width: 1400, layouts: LAYOUTS } });
    expect(container.querySelectorAll(".snapgrid-item")).toHaveLength(2);
  });

  it("re-resolves columns when the width crosses a breakpoint", async () => {
    const { container, rerender } = render(Responsive, {
      props: { width: 1400, layouts: LAYOUTS },
    });
    const wideCols = itemWidth(container, "a");

    // Drop to the xxs breakpoint (fewer, so each column is narrower on a small canvas).
    await rerender({ width: 300, layouts: LAYOUTS });
    const narrowCols = itemWidth(container, "a");

    expect(narrowCols).toBeLessThan(wideCols);
  });

  it("fires onBreakpointChange when the active breakpoint changes", async () => {
    const onBreakpointChange = vi.fn();
    const { rerender } = render(Responsive, {
      props: { width: 1400, layouts: LAYOUTS, onBreakpointChange },
    });
    onBreakpointChange.mockClear();

    await rerender({ width: 300, layouts: LAYOUTS, onBreakpointChange });

    expect(onBreakpointChange).toHaveBeenCalledOnce();
    expect(onBreakpointChange).toHaveBeenCalledWith("xxs", expect.any(Number));
  });
});
