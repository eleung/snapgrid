import { DragDropProvider } from "@dnd-kit/react";
import type { DragSession, Layout } from "@snapgridjs/core";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GridController } from "../../controller/GridController.js";
import { useGridContainer } from "../useGridContainer.js";
import { useGridPlaceholder } from "../useGridPlaceholder.js";

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};
const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 1 },
];

describe("useGridPlaceholder", () => {
  it("is null at rest and returns a positioned marker while a drag previews", () => {
    let controller!: GridController;
    // A holder object so reads stay typed as the hook's union (a closure-assigned
    // `let` would get flow-narrowed to its `null` initializer at the assertions).
    const seen: { placeholder: ReturnType<typeof useGridPlaceholder> } = { placeholder: null };
    function Board() {
      const {
        containerProps,
        group,
        controller: c,
      } = useGridContainer({
        layout,
        width: 1210,
        gridConfig,
      });
      controller = c;
      seen.placeholder = useGridPlaceholder(group);
      return <div {...containerProps} />;
    }
    render(
      <DragDropProvider>
        <Board />
      </DragDropProvider>,
    );

    expect(seen.placeholder).toBeNull(); // no drag → nothing to render

    const session = {
      kind: "move",
      activeId: "a",
      committed: layout,
      preview: layout,
      placeholder: { i: "a", x: 3, y: 1, w: 2, h: 2 },
      anchor: { item: layout[0], left: 0, top: 0, pointer: { x: 0, y: 0 } },
    } as unknown as DragSession;
    act(() => controller.setSession(session));

    expect(seen.placeholder).not.toBeNull();
    expect(seen.placeholder?.item).toMatchObject({ x: 3, y: 1, w: 2, h: 2 });
    // Positioned out of flow with a GPU transform (matches grid items).
    expect(seen.placeholder?.style.position).toBe("absolute");
    expect(String(seen.placeholder?.style.transform)).toMatch(/translate\(.*px.*px\)/);
    expect(seen.placeholder?.style.width).toBe(190); // 2 cols: 2*90 + 1*10
    expect(seen.placeholder?.style.height).toBe(210); // 2 rows: 2*100 + 1*10
  });
});
