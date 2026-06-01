import { DragDropProvider } from "@dnd-kit/react";
import type { DragSession, Layout } from "@snapgridjs/core";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SnapGridProvider } from "./SnapGridProvider.js";
import { useGridRuntime } from "./context.js";
import type { GridController } from "./controller/GridController.js";
import { useGridItem } from "./hooks/useGridItem.js";

// When one tile's slice changes, only that tile's useGridItem re-renders — not
// the whole subtree. (The old context-value model re-rendered every tile on
// every session change.)

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};
const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 1 },
  { i: "c", x: 4, y: 0, w: 1, h: 1 },
];

const renders: Record<string, number> = {};
function Tile({ id }: { id: string }) {
  const { ref, style } = useGridItem(id);
  renders[id] = (renders[id] ?? 0) + 1;
  return <div ref={ref} style={style} data-tile={id} />;
}

// Capture the controller the provider created so the test can drive a session.
function CaptureController({ onReady }: { onReady: (c: GridController) => void }) {
  onReady(useGridRuntime().controller);
  return null;
}

describe("fine-grained re-render scope", () => {
  it("re-renders only the moved tile when the session changes one slice", () => {
    let controller!: GridController;
    render(
      <DragDropProvider>
        <SnapGridProvider layout={layout} width={1210} gridConfig={gridConfig}>
          <CaptureController
            onReady={(c) => {
              controller = c;
            }}
          />
          {layout.map((it) => (
            <Tile key={it.i} id={it.i} />
          ))}
        </SnapGridProvider>
      </DragDropProvider>,
    );

    for (const id of ["a", "b", "c"]) renders[id] = 0;

    // A session where only "a" moves; "b"/"c" stay at their cells (fresh objects,
    // as a compactor returns for unmoved tiles).
    const session = {
      kind: "move",
      activeId: "a",
      committed: layout,
      preview: [
        { i: "a", x: 3, y: 1, w: 2, h: 2 },
        { i: "b", x: 2, y: 0, w: 2, h: 1 },
        { i: "c", x: 4, y: 0, w: 1, h: 1 },
      ],
      placeholder: { i: "a", x: 3, y: 1, w: 2, h: 2 },
      anchor: { item: layout[0], left: 0, top: 0, pointer: { x: 0, y: 0 } },
    } as unknown as DragSession;

    act(() => controller.setSession(session));

    expect(renders.a).toBe(1); // moved → re-rendered once
    expect(renders.b).toBe(0); // unmoved → NOT re-rendered
    expect(renders.c).toBe(0); // unmoved → NOT re-rendered
  });
});
