import { DragDropProvider } from "@dnd-kit/react";
import type { Layout } from "@snapgridjs/core";
import type { GridController } from "@snapgridjs/dnd";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGridContainer } from "../useGridContainer.js";

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};

/** Render a grid host and return its controller so we can read the published predicates. */
function renderGrid(layout: Layout): GridController {
  let controller!: GridController;
  function Board() {
    const r = useGridContainer({ layout, width: 1210, gridConfig });
    controller = r.controller;
    return <div {...r.containerProps} />;
  }
  render(
    <DragDropProvider>
      <Board />
    </DragDropProvider>,
  );
  return controller;
}

describe("pinning: static + isDraggable", () => {
  it("a plain static item is neither draggable nor resizable", () => {
    const c = renderGrid([{ i: "s", x: 0, y: 0, w: 2, h: 2, static: true }]);
    expect(c.config?.isItemDraggable("s")).toBe(false);
    expect(c.config?.isItemResizable("s")).toBe(false);
  });

  it("a static item with isDraggable:true is draggable (pinned) but not resizable", () => {
    const c = renderGrid([{ i: "p", x: 0, y: 0, w: 2, h: 2, static: true, isDraggable: true }]);
    expect(c.config?.isItemDraggable("p")).toBe(true);
    expect(c.config?.isItemResizable("p")).toBe(false);
  });

  it("a static item with isResizable:true is resizable but not draggable", () => {
    const c = renderGrid([{ i: "r", x: 0, y: 0, w: 2, h: 2, static: true, isResizable: true }]);
    expect(c.config?.isItemDraggable("r")).toBe(false);
    expect(c.config?.isItemResizable("r")).toBe(true);
  });

  it("a normal item is draggable and resizable by default", () => {
    const c = renderGrid([{ i: "n", x: 0, y: 0, w: 2, h: 2 }]);
    expect(c.config?.isItemDraggable("n")).toBe(true);
    expect(c.config?.isItemResizable("n")).toBe(true);
  });

  it("explicit isDraggable:false still wins on a non-static item", () => {
    const c = renderGrid([{ i: "x", x: 0, y: 0, w: 2, h: 2, isDraggable: false }]);
    expect(c.config?.isItemDraggable("x")).toBe(false);
  });
});
