import type { Layout } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GridLayout } from "./GridLayout.js";

// Regression: GridController.setCommitted runs during the provider's render, so
// it must NOT notify subscribers — emitting there updates GridItems mid-render
// ("Cannot update a component while rendering a different component"). Changing
// the controlled `layout` prop (what a drop commit does) must not warn.

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe("committed-layout sync (no setState-in-render)", () => {
  it("changing the layout prop does not warn or error", () => {
    const before: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 2 }];
    const after: Layout = [{ i: "a", x: 4, y: 1, w: 2, h: 2 }];
    const { rerender, container } = render(
      <GridLayout layout={before} width={1210} gridConfig={gridConfig}>
        <div key="a">A</div>
      </GridLayout>,
    );
    // Simulate a drop commit: the parent hands down a new layout.
    rerender(
      <GridLayout layout={after} width={1210} gridConfig={gridConfig}>
        <div key="a">A</div>
      </GridLayout>,
    );

    expect(container.querySelector('[data-grid-id="a"]')).not.toBeNull();
    const warnings = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(warnings).not.toMatch(/while rendering a different component/);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
