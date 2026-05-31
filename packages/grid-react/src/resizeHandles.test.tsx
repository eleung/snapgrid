import type { Layout } from "@snapgrid/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridLayout } from "./GridLayout.js";

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};

const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "d", x: 4, y: 0, w: 2, h: 2, static: true },
];

function renderGrid(props: Record<string, unknown> = {}) {
  return render(
    <GridLayout layout={layout} width={1210} gridConfig={gridConfig} {...props}>
      <div key="a">A</div>
      <div key="d">D</div>
    </GridLayout>,
  );
}

describe("resize handles", () => {
  it("renders the default 'se' handle on resizable items, none on static", () => {
    const { container } = renderGrid();
    const a = container.querySelector('[data-grid-id="a"]');
    const d = container.querySelector('[data-grid-id="d"]');
    expect(a?.querySelectorAll(".snapgrid-resize-handle")).toHaveLength(1);
    expect(a?.querySelector(".snapgrid-resize-handle--se")).not.toBeNull();
    expect(d?.querySelectorAll(".snapgrid-resize-handle")).toHaveLength(0);
  });

  it("honours resizeConfig.handles", () => {
    const { container } = renderGrid({ resizeConfig: { handles: ["se", "e", "s"] } });
    const a = container.querySelector('[data-grid-id="a"]');
    expect(a?.querySelectorAll(".snapgrid-resize-handle")).toHaveLength(3);
  });

  it("renders no handles when resizing is disabled", () => {
    const { container } = renderGrid({ isResizable: false });
    expect(container.querySelectorAll(".snapgrid-resize-handle")).toHaveLength(0);
  });

  it("marks handles so item drags can ignore pointer-downs on them", () => {
    const { container } = renderGrid();
    const handle = container.querySelector('[data-grid-id="a"] .snapgrid-resize-handle--se');
    expect(handle?.hasAttribute("data-snapgrid-resize-handle")).toBe(true);
  });
});
