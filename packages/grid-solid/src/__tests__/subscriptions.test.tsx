import type { Layout } from "@snapgridjs/core";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Grid } from "./fixtures.js";

// Counts `GridController.subscribe` calls per controller. `subscribe` is an instance arrow
// property, so it is wrapped per instance in a subclass (vi.mock is file-scoped, hence this
// file of its own).
const subscribeCalls = new Map<unknown, number>();
vi.mock("@snapgridjs/dnd", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@snapgridjs/dnd")>();
  class CountingController extends mod.GridController {
    constructor(...args: ConstructorParameters<typeof mod.GridController>) {
      super(...args);
      const subscribe = this.subscribe;
      this.subscribe = (listener) => {
        subscribeCalls.set(this, (subscribeCalls.get(this) ?? 0) + 1);
        return subscribe(listener);
      };
    }
  }
  return { ...mod, GridController: CountingController };
});

describe("controller subscriptions", () => {
  // Every subscriber's write is its own synchronous Solid flush (nothing batches the
  // controller's emit loop), so N subscribers would mean N update cycles per pointer move.
  // The grid shares one tick per controller instead.
  it("subscribes once per grid, however many tiles and handles it renders", () => {
    const layout: Layout = [
      { i: "a", x: 0, y: 0, w: 1, h: 1 },
      { i: "b", x: 1, y: 0, w: 1, h: 1 },
      { i: "c", x: 2, y: 0, w: 1, h: 1 },
    ];
    const { container } = render(() => <Grid layout={layout} width={400} isResizable />);
    expect(container.querySelectorAll(".snapgrid-resize-handle")).toHaveLength(3);

    expect(subscribeCalls.size).toBe(1);
    expect([...subscribeCalls.values()]).toEqual([1]);
  });
});
