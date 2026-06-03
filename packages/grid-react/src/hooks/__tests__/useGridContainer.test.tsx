import { DragDropProvider } from "@dnd-kit/react";
import type { Layout } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { type GridContainerProps, useGridContainer } from "../useGridContainer.js";

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};
const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 }, // bottom row = 2
  { i: "b", x: 2, y: 0, w: 2, h: 1 },
];

describe("useGridContainer", () => {
  it("auto-sizes the surface height to the content's bottom row", () => {
    let style: CSSProperties = {};
    function Board() {
      const { containerProps } = useGridContainer({ layout, width: 1210, gridConfig });
      style = containerProps.style;
      return <div {...containerProps} />;
    }
    render(
      <DragDropProvider>
        <Board />
      </DragDropProvider>,
    );
    // height = padY*2 + rows*rowHeight + (rows-1)*marginY = 20 + 2*100 + 10
    expect(style.height).toBe(230);
    expect(style.position).toBe("relative");
    expect(style.width).toBe(1210);
  });

  it("does not flag itself a drop target at rest", () => {
    let props!: GridContainerProps;
    function Board() {
      const { containerProps } = useGridContainer({ layout, width: 1210, gridConfig });
      props = containerProps;
      return <div {...containerProps} />;
    }
    render(
      <DragDropProvider>
        <Board />
      </DragDropProvider>,
    );
    expect(props["data-drop-target"]).toBeUndefined();
  });
});
