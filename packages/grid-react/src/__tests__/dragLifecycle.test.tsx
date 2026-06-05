import { DragDropProvider, useDragDropManager } from "@dnd-kit/react";
import type { Layout, LayoutItem } from "@snapgridjs/core";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGridContainer } from "../hooks/useGridContainer.js";
import type { UseGridControllerOptions } from "../hooks/useGridController.js";

// Drives the grid's drag/resize lifecycle by dispatching synthetic operations
// through dnd-kit's monitor (the same channel useDragDropMonitor binds to), so the
// public events contract — onDragStart/onDrag/onDragStop/onResize*/onDrop and the
// onLayoutChange commits, incl. the cross-grid hand-off — is asserted without a
// real browser. (jsdom returns zero rects, but deterministically; in-grid moves
// use the session's pure anchor math, so the moved cell is still meaningful.)

const gridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  containerPadding: [10, 10] as [number, number],
};

type Monitor = { monitor: { dispatch(type: string, event: unknown): void } };
// `group` mirrors the real useGridItem/useGridResizeHandle payload — the engine
// resolves a drag's source grid from it.
type SnapGrid =
  | { kind: "move"; itemId: string; item: LayoutItem; group: string }
  | { kind: "resize"; itemId: string; handle: string; group: string };

function gridSource(snapGrid: SnapGrid) {
  return { id: snapGrid.itemId, data: { snapGrid } };
}
function externalSource(id: string, drop: { w: number; h: number }) {
  return { id, data: { snapGridDrop: drop } };
}

function ev(opts: {
  source?: unknown;
  target?: string | null;
  pointer?: { x: number; y: number };
  canceled?: boolean;
  activator?: Event | null;
}) {
  return {
    operation: {
      source: opts.source ?? null,
      target: opts.target != null ? { id: opts.target } : null,
      position: { current: opts.pointer ?? { x: 0, y: 0 } },
      activatorEvent: opts.activator ?? null,
    },
    canceled: opts.canceled ?? false,
    nativeEvent: null,
  };
}

type Callbacks = Record<
  | "onLayoutChange"
  | "onDragStart"
  | "onDrag"
  | "onDragStop"
  | "onResizeStart"
  | "onResize"
  | "onResizeStop"
  | "onDrop",
  ReturnType<typeof vi.fn>
>;

function makeCallbacks(): Callbacks {
  return {
    onLayoutChange: vi.fn(),
    onDragStart: vi.fn(),
    onDrag: vi.fn(),
    onDragStop: vi.fn(),
    onResizeStart: vi.fn(),
    onResize: vi.fn(),
    onResizeStop: vi.fn(),
    onDrop: vi.fn(),
  };
}

/** Render one grid (id + layout + spies); returns the shared manager and spies. */
function setupGrid(id: string, layout: Layout, extra?: Partial<UseGridControllerOptions>) {
  const cb = makeCallbacks();
  const holder: { manager?: Monitor } = {};
  function Board() {
    holder.manager = useDragDropManager() as unknown as Monitor;
    const { containerProps } = useGridContainer({
      id,
      layout,
      width: 1210,
      gridConfig,
      ...cb,
      ...extra,
    });
    return <div {...containerProps} />;
  }
  render(
    <DragDropProvider>
      <Board />
    </DragDropProvider>,
  );
  return { cb, manager: holder.manager! };
}

function fire(manager: Monitor, type: string, event: unknown) {
  act(() => manager.monitor.dispatch(type, event));
}

/** The layout a spy was first called with (also asserts it was called at all). */
function firstLayout(fn: ReturnType<typeof vi.fn>): Layout {
  const call = fn.mock.calls[0];
  if (!call) throw new Error("expected the callback to have been called");
  return call[0] as Layout;
}

const A: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
const B: LayoutItem = { i: "b", x: 2, y: 0, w: 2, h: 1 };

describe("drag lifecycle (events + commits via the monitor)", () => {
  it("an in-grid move fires onDragStart → onDrag → onDragStop and commits the new layout", () => {
    const { cb, manager } = setupGrid("g", [A, B]);
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "g" };

    fire(
      manager,
      "dragstart",
      ev({ source: gridSource(move), target: "g", pointer: { x: 50, y: 50 } }),
    );
    expect(cb.onDragStart).toHaveBeenCalledTimes(1);

    fire(
      manager,
      "dragmove",
      ev({ source: gridSource(move), target: "g", pointer: { x: 250, y: 160 } }),
    );
    expect(cb.onDrag).toHaveBeenCalled();

    fire(
      manager,
      "dragend",
      ev({ source: gridSource(move), target: "g", pointer: { x: 250, y: 160 } }),
    );
    expect(cb.onDragStop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).toHaveBeenCalledTimes(1);

    const next = firstLayout(cb.onLayoutChange);
    const a = next.find((it) => it.i === "a");
    expect(a).toBeDefined();
    // It moved down-and-right from (0,0); exact cell depends on geometry, but it
    // must have left the origin and stayed in this grid.
    expect((a?.x ?? 0) + (a?.y ?? 0)).toBeGreaterThan(0);
    expect(next.some((it) => it.i === "b")).toBe(true);
  });

  it("a canceled move fires onDragStop but does NOT commit a layout change", () => {
    const { cb, manager } = setupGrid("g", [A, B]);
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "g" };
    fire(
      manager,
      "dragstart",
      ev({ source: gridSource(move), target: "g", pointer: { x: 50, y: 50 } }),
    );
    fire(
      manager,
      "dragmove",
      ev({ source: gridSource(move), target: "g", pointer: { x: 250, y: 160 } }),
    );
    fire(manager, "dragend", ev({ source: gridSource(move), target: "g", canceled: true }));

    expect(cb.onDragStop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).not.toHaveBeenCalled();
  });

  it("a resize fires onResizeStart → onResize → onResizeStop and commits the new size", () => {
    const { cb, manager } = setupGrid("g", [A, B]);
    const resize: SnapGrid = { kind: "resize", itemId: "a", handle: "se", group: "g" };
    fire(
      manager,
      "dragstart",
      ev({ source: gridSource(resize), target: "g", pointer: { x: 200, y: 210 } }),
    );
    expect(cb.onResizeStart).toHaveBeenCalledTimes(1);

    fire(
      manager,
      "dragmove",
      ev({ source: gridSource(resize), target: "g", pointer: { x: 400, y: 210 } }),
    );
    expect(cb.onResize).toHaveBeenCalled();

    fire(
      manager,
      "dragend",
      ev({ source: gridSource(resize), target: "g", pointer: { x: 400, y: 210 } }),
    );
    expect(cb.onResizeStop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).toHaveBeenCalledTimes(1);
    // Dragging the SE handle right grows the width past its starting 2 columns.
    const a = firstLayout(cb.onLayoutChange).find((it) => it.i === "a");
    expect(a?.w ?? 0).toBeGreaterThan(2);
    // A resize is not a move, so onDragStop must not fire for it.
    expect(cb.onDragStop).not.toHaveBeenCalled();
  });

  it("an external draggable dropped in fires onDrop with the synthesized item (not onLayoutChange)", () => {
    const { cb, manager } = setupGrid("g", [A], {
      dropConfig: { enabled: true, defaultItem: { w: 1, h: 1 } },
    });
    const src = externalSource("palette-wide", { w: 3, h: 2 });
    fire(manager, "dragstart", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));
    fire(manager, "dragmove", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));
    fire(manager, "dragend", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));

    expect(cb.onDrop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).not.toHaveBeenCalled(); // external drops go through onDrop
    const [layout, item] = cb.onDrop.mock.calls[0] as [Layout, LayoutItem];
    expect(item).toMatchObject({ w: 3, h: 2 }); // the synthesized size
    expect(item.i.startsWith("g-dropped-")).toBe(true); // id prefixed with the grid's id
    expect(layout.some((it) => it.i === item.i)).toBe(true);
  });

  it("a keyboard drag steps the tile with arrow keys and commits in-grid", () => {
    const { cb, manager } = setupGrid("g", [A, B]);
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "g" };
    const activator = new KeyboardEvent("keydown", { key: "Enter" });
    fire(manager, "dragstart", ev({ source: gridSource(move), target: "g", activator }));
    expect(cb.onDragStart).toHaveBeenCalledTimes(1);

    // The window-capture keydown handler owns arrow keys while a keyboard drag is active.
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    // dnd-kit reports no pointer target for a keyboard drop; it commits in-grid.
    fire(manager, "dragend", ev({ source: gridSource(move), target: null }));

    expect(cb.onDragStop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).toHaveBeenCalledTimes(1);
    const a = firstLayout(cb.onLayoutChange).find((it) => it.i === "a");
    expect(a?.x).toBe(1); // stepped one column right from x:0
    expect(a?.y).toBe(0);
  });
});

describe("cross-grid hand-off (one manager, two grids)", () => {
  it("dragging a tile from grid A into grid B removes it from A and adds it to B", () => {
    const aCb = makeCallbacks();
    const bCb = makeCallbacks();
    const holder: { manager?: Monitor } = {};
    function GridA() {
      holder.manager = useDragDropManager() as unknown as Monitor;
      const { containerProps } = useGridContainer({
        id: "A",
        layout: [A],
        width: 1210,
        gridConfig,
        ...aCb,
      });
      return <div {...containerProps} />;
    }
    function GridB() {
      const x: LayoutItem = { i: "x", x: 0, y: 0, w: 1, h: 1 };
      const { containerProps } = useGridContainer({
        id: "B",
        layout: [x],
        width: 1210,
        gridConfig,
        ...bCb,
      });
      return <div {...containerProps} />;
    }
    render(
      <DragDropProvider>
        <GridA />
        <GridB />
      </DragDropProvider>,
    );
    const manager = holder.manager!;
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "A" };

    // Start in A, move the pointer over B (so B builds a receive session), drop in B.
    fire(
      manager,
      "dragstart",
      ev({ source: gridSource(move), target: "A", pointer: { x: 50, y: 50 } }),
    );
    fire(
      manager,
      "dragmove",
      ev({ source: gridSource(move), target: "B", pointer: { x: 100, y: 100 } }),
    );
    fire(
      manager,
      "dragend",
      ev({ source: gridSource(move), target: "B", pointer: { x: 100, y: 100 } }),
    );

    // Source A: onDragStop + onLayoutChange that no longer contains "a".
    expect(aCb.onDragStop).toHaveBeenCalledTimes(1);
    expect(aCb.onLayoutChange).toHaveBeenCalledTimes(1);
    const aNext = firstLayout(aCb.onLayoutChange);
    expect(aNext.some((it) => it.i === "a")).toBe(false);

    // Destination B: onLayoutChange that now contains "a" — and NOT onDragStop
    // (B never started the drag, so firing its stop pair would be unbalanced).
    expect(bCb.onLayoutChange).toHaveBeenCalledTimes(1);
    const bNext = firstLayout(bCb.onLayoutChange);
    expect(bNext.some((it) => it.i === "a")).toBe(true);
    expect(bCb.onDragStop).not.toHaveBeenCalled();
  });

  it("a drop whose end-target differs from the previewed grid still lands there (no lost tile)", () => {
    const aCb = makeCallbacks();
    const bCb = makeCallbacks();
    const holder: { manager?: Monitor } = {};
    function GridA() {
      holder.manager = useDragDropManager() as unknown as Monitor;
      const { containerProps } = useGridContainer({
        id: "A",
        layout: [A],
        width: 1210,
        gridConfig,
        ...aCb,
      });
      return <div {...containerProps} />;
    }
    function GridB() {
      const x: LayoutItem = { i: "x", x: 0, y: 0, w: 1, h: 1 };
      const { containerProps } = useGridContainer({
        id: "B",
        layout: [x],
        width: 1210,
        gridConfig,
        ...bCb,
      });
      return <div {...containerProps} />;
    }
    render(
      <DragDropProvider>
        <GridA />
        <GridB />
      </DragDropProvider>,
    );
    const manager = holder.manager!;
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "A" };

    // Preview into B (B builds the receive session), but release with a drop target
    // that ISN'T B — a racy/overlapping collision result at the drop frame. The item
    // must follow the live receive session in B, never be removed from A and
    // committed nowhere (the silent-loss bug).
    fire(
      manager,
      "dragstart",
      ev({ source: gridSource(move), target: "A", pointer: { x: 50, y: 50 } }),
    );
    fire(
      manager,
      "dragmove",
      ev({ source: gridSource(move), target: "B", pointer: { x: 100, y: 100 } }),
    );
    fire(
      manager,
      "dragend",
      ev({ source: gridSource(move), target: "C", pointer: { x: 100, y: 100 } }),
    );

    // A still loses "a"…
    expect(aCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(aCb.onLayoutChange).some((it) => it.i === "a")).toBe(false);
    // …and it lands in the previewed grid B, not lost to the mismatched target.
    expect(bCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(bCb.onLayoutChange).some((it) => it.i === "a")).toBe(true);
  });
});
