import { DragDropProvider, useDragDropManager } from "@dnd-kit/react";
import type { Layout } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridLayout, SnapGridGroup } from "./GridLayout.js";

// GridLayout supplies the dnd-kit DragDropProvider for the turnkey case; nested
// GridLayouts (or a SnapGridGroup) share one. A consumer's own provider is
// honored — GridLayout only self-mints when no provider is above it.

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};
const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 2 }];

// Probe the ambient manager identity at its mount point.
function ManagerProbe({ onManager }: { onManager: (m: unknown) => void }) {
  onManager(useDragDropManager());
  return null;
}

describe("provider extraction", () => {
  it("turnkey GridLayout renders without a consumer-supplied provider", () => {
    // No <DragDropProvider> wrapper: GridLayout must self-provide.
    const { container } = render(
      <GridLayout layout={layout} width={1210} gridConfig={gridConfig}>
        <div key="a">A</div>
      </GridLayout>,
    );
    expect(container.querySelectorAll(".snapgrid-item")).toHaveLength(1);
  });

  it("two standalone GridLayouts each get their own manager", () => {
    const managers: unknown[] = [];
    render(
      <>
        <GridLayout layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
        <GridLayout layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
      </>,
    );
    expect(managers).toHaveLength(2);
    expect(managers[0]).toBeTruthy();
    expect(managers[1]).toBeTruthy();
    // Independent providers → distinct managers (so item ids can't collide).
    expect(managers[0]).not.toBe(managers[1]);
  });

  it("grids in a SnapGridGroup share one manager (no double-mint)", () => {
    const managers: unknown[] = [];
    render(
      <SnapGridGroup>
        <GridLayout layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
        <GridLayout layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
      </SnapGridGroup>,
    );
    expect(managers).toHaveLength(2);
    expect(managers[0]).toBeTruthy();
    // Shared group provider → both grids see the same manager.
    expect(managers[0]).toBe(managers[1]);
  });

  it("nested GridLayouts share one provider (cross-grid seam)", () => {
    // Two GridLayouts under a SnapGridGroup resolve the SAME manager, so a tile
    // can be dragged between them.
    const managers: unknown[] = [];
    render(
      <SnapGridGroup>
        <GridLayout id="g1" layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
        <GridLayout id="g2" layout={layout} width={600} gridConfig={gridConfig}>
          <ManagerProbe key="a" onManager={(m) => managers.push(m)} />
        </GridLayout>
      </SnapGridGroup>,
    );
    expect(managers[0]).toBe(managers[1]);
  });
});
