import { type Layout, calcGridItemPosition, toPositionParams } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridLayout } from "./GridLayout.js";

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};
const pp = toPositionParams({ ...gridConfig, maxRows: Number.POSITIVE_INFINITY }, 1210);

const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 1 },
];

function renderGrid() {
  return render(
    <GridLayout layout={layout} width={1210} gridConfig={gridConfig}>
      <div key="a">A</div>
      <div key="b">B</div>
    </GridLayout>,
  );
}

describe("GridLayout rendering", () => {
  it("renders one positioned tile per keyed child", () => {
    const { container } = renderGrid();
    expect(container.querySelectorAll(".snapgrid-item")).toHaveLength(2);
  });

  it("positions each tile at its grid cell (transform translate + size in px)", () => {
    const { container } = renderGrid();
    const a = container.querySelector<HTMLElement>('[data-grid-id="a"]');
    const posA = calcGridItemPosition(pp, 0, 0, 2, 2);
    // Positioned with a compositor transform (not left/top) so large grids stay
    // smooth in WebKit — see useGridItem.
    expect(a?.style.transform).toBe(`translate(${posA.left}px, ${posA.top}px)`);
    expect(a?.style.width).toBe(`${posA.width}px`);
    expect(a?.style.height).toBe(`${posA.height}px`);
  });

  it("auto-sizes the container height to the occupied rows", () => {
    const { container } = renderGrid();
    const surface = container.querySelector<HTMLElement>(".snapgrid");
    // bottom = 2 rows -> padY*2 + 2*rowHeight + (2-1)*marginY = 20 + 200 + 10 = 230
    expect(surface?.style.height).toBe("230px");
  });

  it("renders the user content inside the tiles", () => {
    const { getByText } = renderGrid();
    expect(getByText("A")).toBeDefined();
    expect(getByText("B")).toBeDefined();
  });

  it("renders no drag overlay at rest", () => {
    renderGrid();
    expect(document.querySelector(".snapgrid-overlay")).toBeNull();
  });
});
