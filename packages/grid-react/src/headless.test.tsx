import { type Layout, calcGridItemPosition, toPositionParams } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SnapGridProvider } from "./SnapGridProvider.js";
import { useGridContainer } from "./hooks/useGridContainer.js";
import { useGridItem } from "./hooks/useGridItem.js";

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

// A consumer rendering entirely their own markup (semantic tags, own classes).
function Tile({ id }: { id: string }) {
  const { ref, style } = useGridItem(id);
  return (
    <article ref={ref} style={style} className="my-card" data-tile={id}>
      {id}
    </article>
  );
}

function Board() {
  const { containerProps } = useGridContainer();
  return (
    <section {...containerProps} className="my-board" data-testid="board">
      {layout.map((it) => (
        <Tile key={it.i} id={it.i} />
      ))}
    </section>
  );
}

describe("headless API (SnapGridProvider + hooks, custom markup)", () => {
  function renderBoard() {
    return render(
      <SnapGridProvider layout={layout} width={1210} gridConfig={gridConfig}>
        <Board />
      </SnapGridProvider>,
    );
  }

  it("lets the consumer choose their own tags and classes", () => {
    const { container } = renderBoard();
    expect(container.querySelector("section.my-board")).not.toBeNull();
    expect(container.querySelectorAll("article.my-card")).toHaveLength(2);
  });

  it("positions consumer elements via the returned style", () => {
    const { container } = renderBoard();
    const a = container.querySelector<HTMLElement>('[data-tile="a"]');
    const posA = calcGridItemPosition(pp, 0, 0, 2, 2);
    expect(a?.style.transform).toBe(`translate(${posA.left}px, ${posA.top}px)`);
    expect(a?.style.position).toBe("absolute");
  });

  it("sizes the container element the consumer rendered", () => {
    const { getByTestId } = renderBoard();
    const board = getByTestId("board");
    expect(board.style.position).toBe("relative");
    // bottom = 2 rows -> 20 + 200 + 10 = 230
    expect(board.style.height).toBe("230px");
  });
});
