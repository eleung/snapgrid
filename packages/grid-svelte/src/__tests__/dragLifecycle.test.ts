import type { Layout, LayoutItem } from "@snapgridjs/core";
import { render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { describe, expect, it, vi } from "vitest";
import CrossGrid from "./fixtures/CrossGrid.svelte";
import DragProvider from "./fixtures/DragProvider.svelte";

// Drives the grid's drag/resize lifecycle by dispatching synthetic operations through
// dnd-kit's monitor (the same channel the engine binds to), so the public events
// contract — onDragStart/onDrag/onDragStop/onResize*/onDrop and the onLayoutChange
// commits, incl. cross-grid — is asserted without a real browser. Mirrors the React
// binding's dragLifecycle test; a shared engine, two bindings.

type Monitor = { monitor: { dispatch(type: string, event: unknown): void } };

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

function fire(manager: Monitor, type: string, event: unknown) {
  flushSync(() => manager.monitor.dispatch(type, event));
}

function firstLayout(fn: ReturnType<typeof vi.fn>): Layout {
  const call = fn.mock.calls[0];
  if (!call) throw new Error("expected the callback to have been called");
  return call[0] as Layout;
}

const A: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 2 };
const B: LayoutItem = { i: "b", x: 2, y: 0, w: 2, h: 1 };

function setupGrid(id: string, layout: Layout, extra?: Record<string, unknown>) {
  const cb = makeCallbacks();
  let manager!: Monitor;
  render(DragProvider, {
    props: {
      id,
      layout,
      options: { ...cb, ...extra },
      onManager: (m: unknown) => {
        manager = m as Monitor;
      },
    },
  });
  return { cb, manager };
}

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
    const a = firstLayout(cb.onLayoutChange).find((it) => it.i === "a");
    expect(a?.w ?? 0).toBeGreaterThan(2);
    expect(cb.onDragStop).not.toHaveBeenCalled();
  });

  it("an external draggable dropped in fires onDrop with the synthesized item", () => {
    const { cb, manager } = setupGrid("g", [A], {
      dropConfig: { enabled: true, defaultItem: { w: 1, h: 1 } },
    });
    const src = externalSource("palette-wide", { w: 3, h: 2 });
    fire(manager, "dragstart", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));
    fire(manager, "dragmove", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));
    fire(manager, "dragend", ev({ source: src, target: "g", pointer: { x: 100, y: 100 } }));

    expect(cb.onDrop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).not.toHaveBeenCalled();
    const [layout, item] = cb.onDrop.mock.calls[0] as [Layout, LayoutItem];
    expect(item).toMatchObject({ w: 3, h: 2 });
    expect(item.i.startsWith("g-dropped-")).toBe(true);
    expect(layout.some((it) => it.i === item.i)).toBe(true);
  });

  it("a keyboard drag steps the tile with arrow keys and commits in-grid", () => {
    const { cb, manager } = setupGrid("g", [A, B]);
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "g" };
    const activator = new KeyboardEvent("keydown", { key: "Enter" });
    fire(manager, "dragstart", ev({ source: gridSource(move), target: "g", activator }));
    expect(cb.onDragStart).toHaveBeenCalledTimes(1);

    flushSync(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })));
    fire(manager, "dragend", ev({ source: gridSource(move), target: null }));

    expect(cb.onDragStop).toHaveBeenCalledTimes(1);
    expect(cb.onLayoutChange).toHaveBeenCalledTimes(1);
    const a = firstLayout(cb.onLayoutChange).find((it) => it.i === "a");
    expect(a?.x).toBe(1);
    expect(a?.y).toBe(0);
  });
});

describe("cross-grid hand-off (one manager, two grids)", () => {
  it("dragging a tile from grid A into grid B removes it from A and adds it to B", () => {
    const aCb = makeCallbacks();
    const bCb = makeCallbacks();
    let manager!: Monitor;
    render(CrossGrid, {
      props: {
        a: { id: "A", layout: [A], options: { ...aCb } },
        b: { id: "B", layout: [{ i: "x", x: 0, y: 0, w: 1, h: 1 }], options: { ...bCb } },
        onManager: (m: unknown) => {
          manager = m as Monitor;
        },
      },
    });
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "A" };

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

    expect(aCb.onDragStop).toHaveBeenCalledTimes(1);
    expect(aCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(aCb.onLayoutChange).some((it) => it.i === "a")).toBe(false);

    expect(bCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(bCb.onLayoutChange).some((it) => it.i === "a")).toBe(true);
    expect(bCb.onDragStop).not.toHaveBeenCalled();
  });

  it("a drop whose end-target differs from the previewed grid still lands there", () => {
    const aCb = makeCallbacks();
    const bCb = makeCallbacks();
    let manager!: Monitor;
    render(CrossGrid, {
      props: {
        a: { id: "A", layout: [A], options: { ...aCb } },
        b: { id: "B", layout: [{ i: "x", x: 0, y: 0, w: 1, h: 1 }], options: { ...bCb } },
        onManager: (m: unknown) => {
          manager = m as Monitor;
        },
      },
    });
    const move: SnapGrid = { kind: "move", itemId: "a", item: A, group: "A" };

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

    expect(aCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(aCb.onLayoutChange).some((it) => it.i === "a")).toBe(false);
    expect(bCb.onLayoutChange).toHaveBeenCalledTimes(1);
    expect(firstLayout(bCb.onLayoutChange).some((it) => it.i === "a")).toBe(true);
  });
});
