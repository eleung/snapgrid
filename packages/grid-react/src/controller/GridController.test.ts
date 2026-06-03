import type { DragSession, Layout, LayoutItem } from "@snapgridjs/core";
import { describe, expect, it, vi } from "vitest";
import { GridController } from "./GridController.js";

const layout: Layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 1 },
  { i: "c", x: 4, y: 0, w: 1, h: 1 },
];

// A minimal move session: `a` moved to a new cell; `b`/`c` are fresh objects at
// their *original* cells (what a compactor returns for unmoved tiles each frame).
function moveSession(): DragSession {
  const preview: Layout = [
    { i: "a", x: 3, y: 1, w: 2, h: 2 },
    { i: "b", x: 2, y: 0, w: 2, h: 1 }, // unmoved — fresh object, same cell
    { i: "c", x: 4, y: 0, w: 1, h: 1 }, // unmoved — fresh object, same cell
  ];
  return {
    kind: "move",
    activeId: "a",
    committed: layout,
    preview,
    placeholder: preview[0],
    anchor: { item: layout[0], left: 0, top: 0, pointer: { x: 0, y: 0 } },
  } as unknown as DragSession;
}

describe("GridController snapshots (fine-grained re-render basis)", () => {
  it("returns a stable item snapshot reference when nothing changed", () => {
    const c = new GridController("g", layout);
    const first = c.itemSnapshot("a");
    expect(first.item?.i).toBe("a");
    expect(c.itemSnapshot("a")).toBe(first); // identical → React won't re-render
  });

  it("keeps UNMOVED items' snapshots stable across a session change", () => {
    const c = new GridController("g", layout);
    const a0 = c.itemSnapshot("a");
    const b0 = c.itemSnapshot("b");
    const cc0 = c.itemSnapshot("c");

    c.setSession(moveSession());

    // The dragged tile's slice changed (new cell + isDragging) → new reference.
    const a1 = c.itemSnapshot("a");
    expect(a1).not.toBe(a0);
    expect(a1.isDragging).toBe(true);
    expect(a1.item).toMatchObject({ x: 3, y: 1 });

    // The untouched tiles' slices are value-equal despite fresh preview objects
    // → SAME reference → those components do NOT re-render.
    expect(c.itemSnapshot("b")).toBe(b0);
    expect(c.itemSnapshot("c")).toBe(cc0);
  });

  it("notifies subscribers on session change and stops after unsubscribe", () => {
    const c = new GridController("g", layout);
    const listener = vi.fn();
    const unsub = c.subscribe(listener);
    c.setSession(moveSession());
    expect(listener).toHaveBeenCalledTimes(1);
    c.setSession(null);
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    c.setSession(moveSession());
    expect(listener).toHaveBeenCalledTimes(2); // no further calls
  });

  it("setCommitted updates the layout WITHOUT notifying (it runs during render)", () => {
    const c = new GridController("g", layout);
    const listener = vi.fn();
    c.subscribe(listener);
    const next: Layout = [{ i: "a", x: 5, y: 5, w: 1, h: 1 }];
    c.setCommitted(next);
    // No emit: notifying here would be a setState-during-render error. A layout
    // prop change already re-renders the subtree, so the new value is picked up.
    expect(listener).not.toHaveBeenCalled();
    expect(c.itemSnapshot("a").item).toMatchObject({ x: 5, y: 5 });
  });

  it("placeholder snapshot is null at rest, stable by value while dragging", () => {
    const c = new GridController("g", layout);
    expect(c.placeholderSnapshot()).toBeNull();
    c.setSession(moveSession());
    const p1 = c.placeholderSnapshot();
    expect(p1).toMatchObject({ i: "a", x: 3, y: 1 });
    expect(c.placeholderSnapshot()).toBe(p1); // stable across reads
  });

  it("itemIndex is stable while present and reclaimed when an item leaves", () => {
    const c = new GridController("g", layout);
    const ia = c.itemIndex("a");
    const ib = c.itemIndex("b");
    const ic = c.itemIndex("c");
    expect(new Set([ia, ib, ic]).size).toBe(3); // distinct indices
    expect(c.itemIndex("a")).toBe(ia); // stable across reads

    // Drop "b" from the committed layout: surviving items keep their index, and
    // "b"'s entry is reclaimed rather than leaked.
    c.setCommitted(layout.filter((it) => it.i !== "b"));
    expect(c.itemIndex("a")).toBe(ia);
    expect(c.itemIndex("c")).toBe(ic);

    // Re-adding "b" mints a fresh index — proof the old entry was dropped, so the
    // index map can't grow without bound under add/remove churn.
    c.setCommitted(layout);
    expect(c.itemIndex("b")).not.toBe(ib);
  });

  it("setId re-points the grid id so group/droppable/registry stay in sync", () => {
    const c = new GridController("g1", layout);
    expect(c.id).toBe("g1");
    c.setId("g2");
    expect(c.id).toBe("g2");
  });

  it("resize snapshot flips isResizing only for the resized item", () => {
    const c = new GridController("g", layout);
    const a0 = c.resizeSnapshot("a");
    expect(a0.isResizing).toBe(false);
    c.setSession({
      kind: "resize",
      activeId: "a",
      committed: layout,
      preview: layout,
      placeholder: layout[0],
      anchor: { item: layout[0], left: 0, top: 0, pointer: { x: 0, y: 0 } },
    } as unknown as DragSession);
    expect(c.resizeSnapshot("a").isResizing).toBe(true);
    expect(c.resizeSnapshot("b")).toBe(c.resizeSnapshot("b")); // stable, false
    expect(c.resizeSnapshot("b").isResizing).toBe(false);
  });
});
