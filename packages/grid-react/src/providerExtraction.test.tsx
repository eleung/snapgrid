import { DragDropProvider, useDragDropManager } from "@dnd-kit/react";
import type { Layout } from "@snapgridjs/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridLayout } from "./GridLayout.js";
import { SnapGridGroup } from "./SnapGridGroup.js";

// GridLayout supplies the dnd-kit DragDropProvider for the turnkey case, except
// inside a SnapGridGroup which provides one shared across its grids.
// SnapGridProvider itself no longer mints a provider.

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

  it("a SnapGridGroup mints its own provider even inside a consumer's provider", () => {
    const outer: unknown[] = [];
    const inner: unknown[] = [];
    render(
      <DragDropProvider>
        <ManagerProbe onManager={(m) => outer.push(m)} />
        <SnapGridGroup>
          <GridLayout layout={layout} width={600} gridConfig={gridConfig}>
            <ManagerProbe key="a" onManager={(m) => inner.push(m)} />
          </GridLayout>
        </SnapGridGroup>
      </DragDropProvider>,
    );
    // KNOWN LIMITATION: the group mints its own provider (its registry binds the
    // grids), so nested grids do NOT inherit the consumer's outer one. Acceptable
    // for now — SnapGridGroup is slated for removal, when cross-grid becomes
    // "share the ambient provider" directly.
    expect(outer[0]).toBeTruthy();
    expect(inner[0]).toBeTruthy();
    expect(inner[0]).not.toBe(outer[0]);
  });
});
