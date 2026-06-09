import type { DragDropManager } from "@dnd-kit/dom";
import {
  type Layout,
  type LayoutItem,
  defaultGridConfig,
  toPositionParams,
  verticalCompactor,
} from "@snapgridjs/core";
import { describe, expect, it } from "vitest";
import { GridController, type GridControllerConfig } from "../controller/GridController.js";
import { registerController } from "../controller/registry.js";
import { type SnapMoveContext, type SnapMoveEvent, snapMove } from "../snapMove.js";

const pp = toPositionParams(
  { ...defaultGridConfig, cols: 12, rowHeight: 100, margin: [10, 10], containerPadding: [10, 10] },
  1210,
);
const ctx = (extra?: Partial<SnapMoveContext>): SnapMoveContext => ({
  positionParams: pp,
  compactor: verticalCompactor,
  gridRect: { left: 0, top: 0 },
  ...extra,
});

function ev(source: SnapMoveEvent["operation"]["source"], pointer: { x: number; y: number }) {
  return {
    operation: { source, target: null, position: { current: pointer } },
  } satisfies SnapMoveEvent;
}

// snapMove reads only positionParams, compactor, and dropConfig off `config` (and
// `element` off the controller), so stub just those and cast — the rest of
// GridControllerConfig is irrelevant here and would only couple this unit test to
// unrelated config-shape changes.
function gridConfig(extra?: Partial<GridControllerConfig>): GridControllerConfig {
  return { positionParams: pp, compactor: verticalCompactor, ...extra } as GridControllerConfig;
}

// A controller registered on `manager` under id "g", with a stub element whose
// rect maps the pointer like a grid at the origin.
function registerGrid(manager: object, extra?: Partial<GridControllerConfig>): () => void {
  const controller = new GridController("g", []);
  controller.setConfig(gridConfig(extra));
  controller.element = {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  } as unknown as Element;
  return registerController(manager, "g", controller);
}

describe("snapMove", () => {
  it("inserts a foreign source (no snapgrid payload) at the pointer cell, using defaultItem size", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev({ id: "new" }, { x: 500, y: 250 }),
      ctx({ defaultItem: { w: 2, h: 2 } }),
    );
    const inserted = next.find((it) => it.i === "new");
    expect(inserted).toBeDefined();
    expect(inserted).toMatchObject({ w: 2, h: 2 });
    expect(next.some((it) => it.i === "a")).toBe(true); // existing tile kept
  });

  it("moves an existing tile (from its snapgrid move payload) to the pointer cell, preserving its size", () => {
    const a: LayoutItem = { i: "a", x: 0, y: 0, w: 2, h: 1 };
    const layout: Layout = [a, { i: "b", x: 2, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev(
        { id: "a", data: { snapGrid: { kind: "move", itemId: "a", item: a, group: "g" } } },
        { x: 600, y: 260 },
      ),
      ctx(),
    );
    const moved = next.find((it) => it.i === "a");
    expect(moved).toBeDefined();
    expect(moved?.w).toBe(2); // size from the payload, not the default
    expect((moved?.x ?? 0) + (moved?.y ?? 0)).toBeGreaterThan(0); // left the origin
    expect(next.some((it) => it.i === "b")).toBe(true);
  });

  it("displaces the occupant when inserting into an occupied cell (compaction)", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    const next = snapMove(
      layout,
      ev({ id: "x" }, { x: 2, y: 2 }), // top-left → cell (0,0), where "a" sits
      ctx({ defaultItem: { w: 2, h: 1 } }),
    );
    const x = next.find((it) => it.i === "x");
    const a = next.find((it) => it.i === "a");
    expect(x).toMatchObject({ x: 0, y: 0 }); // the dropped item takes the top-left cell
    expect(a?.y ?? 0).toBeGreaterThan(0); // the occupant is pushed down, not overlapped
  });

  it("returns the layout unchanged when there is no source", () => {
    const layout: Layout = [{ i: "a", x: 0, y: 0, w: 2, h: 1 }];
    expect(snapMove(layout, ev(null, { x: 0, y: 0 }), ctx())).toBe(layout);
  });

  it("honors a foreign source's snapGridDrop spec (size + id), like external drop", () => {
    const next = snapMove(
      [],
      ev({ id: "raw", data: { snapGridDrop: { i: "custom", w: 4, h: 3 } } }, { x: 100, y: 100 }),
      ctx(),
    );
    const inserted = next.find((it) => it.i === "custom"); // id from snapGridDrop.i, not source.id
    expect(inserted).toBeDefined();
    expect(inserted).toMatchObject({ w: 4, h: 3 }); // size from snapGridDrop, not defaultItem
  });

  it("resolves geometry, compactor, and defaultItem from the target grid's controller", () => {
    // The registry is keyed by manager identity; cast a bare object as the manager.
    const manager = {} as unknown as DragDropManager;
    const unregister = registerGrid(manager, {
      dropConfig: { enabled: true, defaultItem: { w: 3, h: 2 } },
    });
    try {
      // No context at all: the destination grid is resolved from event.target.
      const event = {
        operation: {
          source: { id: "new" },
          target: { id: "g", manager },
          position: { current: { x: 500, y: 250 } },
        },
      } satisfies SnapMoveEvent;
      const next = snapMove([{ i: "a", x: 0, y: 0, w: 2, h: 1 }], event);

      const inserted = next.find((it) => it.i === "new");
      expect(inserted).toBeDefined();
      expect(inserted).toMatchObject({ w: 3, h: 2 }); // size from the grid's dropConfig.defaultItem
      expect(next.some((it) => it.i === "a")).toBe(true);
    } finally {
      unregister();
    }
  });

  it("lets an explicit context override the resolved grid", () => {
    const manager = {} as unknown as DragDropManager;
    const unregister = registerGrid(manager, {
      dropConfig: { enabled: true, defaultItem: { w: 3, h: 2 } },
    });
    try {
      const event = {
        operation: {
          source: { id: "new" },
          target: { id: "g", manager },
          position: { current: { x: 500, y: 250 } },
        },
      } satisfies SnapMoveEvent;
      // Explicit defaultItem wins over the grid's dropConfig.
      const next = snapMove([], event, { defaultItem: { w: 1, h: 1 } });
      expect(next.find((it) => it.i === "new")).toMatchObject({ w: 1, h: 1 });
    } finally {
      unregister();
    }
  });

  it("throws when geometry is neither provided nor resolvable from the target", () => {
    // target is null (ev) and no context → nothing to resolve.
    expect(() => snapMove([], ev({ id: "x" }, { x: 0, y: 0 }))).toThrow(/no grid geometry/);
  });
});
