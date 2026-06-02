import { DragDropProvider } from "@dnd-kit/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridDragOverlay } from "./GridDragOverlay.js";

// The overlay element dnd-kit renders carries this attribute (see @dnd-kit/dom).
const OVERLAY = "[data-dnd-overlay]";

function renderOverlay(style?: React.CSSProperties) {
  return render(
    <DragDropProvider>
      <GridDragOverlay style={style}>
        {({ item }) => <div data-testid="preview">{item?.i ?? "none"}</div>}
      </GridDragOverlay>
    </DragDropProvider>,
  );
}

describe("GridDragOverlay", () => {
  it("bakes the out-of-flow base style onto the overlay element", () => {
    const { container } = renderOverlay();
    const el = container.querySelector<HTMLElement>(OVERLAY);
    expect(el).not.toBeNull();
    expect(el?.style.position).toBe("fixed");
    expect(el?.style.top).toBe("0px");
    expect(el?.style.left).toBe("0px");
    expect(el?.style.pointerEvents).toBe("none");
  });

  it("merges a caller style, letting it override the base", () => {
    const { container } = renderOverlay({ position: "absolute", zIndex: 5 });
    const el = container.querySelector<HTMLElement>(OVERLAY);
    // Caller wins on a clash...
    expect(el?.style.position).toBe("absolute");
    // ...while the rest of the base stays, plus the caller's own additions.
    expect(el?.style.top).toBe("0px");
    expect(el?.style.zIndex).toBe("5");
  });

  it("does not invoke the render prop while idle (no drag source)", () => {
    const { queryByTestId } = renderOverlay();
    // dnd-kit only calls the function child once a drag is active, so there is
    // no preview content (and no resolved item) when nothing is being dragged.
    expect(queryByTestId("preview")).toBeNull();
  });
});
