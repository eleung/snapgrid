import { describe, expect, it } from "vitest";
import { GridController } from "../GridController.js";
import { getController, getGrabOffset, registerController, setGrabOffset } from "../registry.js";

// The registry is the context-free resolution layer: a grid host registers its
// controller under an id (scoped to its dnd-kit manager) and items look it up by
// `group`. It also carries the active drag's grab offset across grids.

describe("registry: controller resolution", () => {
  it("registers and resolves a controller by id, scoped to its manager", () => {
    const manager = {};
    const c = new GridController("g1");
    registerController(manager, "g1", c);
    expect(getController(manager, "g1")).toBe(c);
    expect(getController(manager, "nope")).toBeUndefined();
  });

  it("isolates controllers by manager (two providers may reuse the same id)", () => {
    const m1 = {};
    const m2 = {};
    const c1 = new GridController("g");
    const c2 = new GridController("g");
    registerController(m1, "g", c1);
    registerController(m2, "g", c2);
    expect(getController(m1, "g")).toBe(c1);
    expect(getController(m2, "g")).toBe(c2);
  });

  it("unregister only removes its OWN controller, not a newer one under the same id", () => {
    const manager = {};
    const c1 = new GridController("g");
    const unregister = registerController(manager, "g", c1);
    const c2 = new GridController("g");
    registerController(manager, "g", c2); // c2 takes over "g"
    unregister(); // c1's cleanup must not clobber c2 (e.g. a remount race)
    expect(getController(manager, "g")).toBe(c2);
  });

  it("falls back to one shared map when there is no manager (null/undefined are the same)", () => {
    const c = new GridController("g-nomgr");
    registerController(null, "g-nomgr", c);
    expect(getController(undefined, "g-nomgr")).toBe(c);
  });
});

describe("registry: grab offset", () => {
  it("stores/reads the grab offset per manager and defaults to {0,0}", () => {
    const manager = {};
    expect(getGrabOffset(manager)).toEqual({ x: 0, y: 0 }); // none set yet
    setGrabOffset(manager, { x: 5, y: 7 });
    expect(getGrabOffset(manager)).toEqual({ x: 5, y: 7 });
    setGrabOffset(manager, null); // cleared on drag end
    expect(getGrabOffset(manager)).toEqual({ x: 0, y: 0 });
  });
});
