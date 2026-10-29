import { useDragDropManager } from "@dnd-kit/solid";
import type { Layout, ResponsiveLayouts } from "@snapgridjs/core";
import { render } from "@solidjs/testing-library";
import { type JSX, Show, createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  GridLayout,
  ResponsiveGridLayout,
  SnapGridGroup,
  resolveController,
  useContainerWidth,
  useResponsiveLayout,
} from "../index.js";

type Manager = { registry: { draggables: { get(id: string): Draggable | undefined } } };
type Draggable = { group?: string; data: { snapGrid: { item: unknown; group: string } } };

/** Captures the ambient dnd-kit manager, to inspect what the tiles registered with it. */
function ManagerProbe(props: { onManager: (m: Manager) => void }): JSX.Element {
  props.onManager(useDragDropManager() as unknown as Manager);
  return null;
}

/** Renders whether `group` resolves in the registry at the time it sets up. */
function Probe(props: { group: string }): JSX.Element {
  let registered = true;
  try {
    resolveController(props.group);
  } catch {
    registered = false;
  }
  return <div data-probe={props.group} data-registered={String(registered)} />;
}

function probed(root: Element, group: string): string | null | undefined {
  return root.querySelector(`[data-probe="${group}"]`)?.getAttribute("data-registered");
}

describe("useContainerWidth", () => {
  it("observes the element once and disconnects on unmount", () => {
    let constructed = 0;
    let disconnected = 0;
    class SpyResizeObserver {
      constructor(_cb: unknown) {
        constructed += 1;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        disconnected += 1;
      }
    }
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = SpyResizeObserver as unknown as typeof ResizeObserver;

    try {
      const [n, setN] = createSignal(1);
      function Host() {
        const { ref } = useContainerWidth();
        return <div ref={ref}>{n()}</div>;
      }

      const { unmount } = render(() => <Host />);
      setN(2);
      setN(3);
      expect(constructed).toBe(1);

      unmount();
      expect(disconnected).toBe(1);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });
});

describe("controller registry", () => {
  const LAYOUT: Layout = [{ i: "a", x: 0, y: 0, w: 1, h: 1 }];

  // Tiles resolve their grid by `group` from the registry (Solid has no imperative
  // provide), so the registry key must follow the grid's `id` prop.
  it("re-registers the grid under a changed `id`", () => {
    const [id, setId] = createSignal("before");
    const [probe, setProbe] = createSignal(1);
    const { container } = render(() => (
      <SnapGridGroup>
        <GridLayout id={id()} layout={LAYOUT} width={400}>
          {() => <div />}
        </GridLayout>
        {/* Keyed: re-created on each `probe` bump, so it re-resolves after the change. (A
            `<Show>` child is only a render callback when it declares a parameter.) */}
        <Show when={probe()} keyed>
          {(_n) => (
            <>
              <Probe group="before" />
              <Probe group="after" />
            </>
          )}
        </Show>
      </SnapGridGroup>
    ));
    expect(probed(container, "before")).toBe("true");
    expect(probed(container, "after")).toBe("false");

    setId("after");
    setProbe(2);

    expect(probed(container, "before")).toBe("false");
    expect(probed(container, "after")).toBe("true");
  });

  it("unregisters the grid when it unmounts", () => {
    const [shown, setShown] = createSignal(true);
    const [probe, setProbe] = createSignal(1);
    const { container } = render(() => (
      <SnapGridGroup>
        <Show when={shown()}>
          <GridLayout id="grid" layout={LAYOUT} width={400}>
            {() => <div />}
          </GridLayout>
        </Show>
        <Show when={probe()} keyed>
          {(_n) => <Probe group="grid" />}
        </Show>
      </SnapGridGroup>
    ));
    expect(probed(container, "grid")).toBe("true");

    setShown(false);
    setProbe(2);

    expect(probed(container, "grid")).toBe("false");
  });
});

describe("ResponsiveGridLayout", () => {
  // `GridLayout` reads `id` as the grid's droppable/registry key, so an `id` forwarded
  // through as an attribute would silently make two responsive grids in one group collide
  // on the same key.
  it("does not let an `id` attribute become the grid's registry key", () => {
    const layouts: ResponsiveLayouts = { lg: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }] };
    // Not a declared prop, but nothing stops it arriving at runtime (e.g. via a spread).
    const stray = { id: "dashboard" } as Record<string, string>;

    // The probe renders after the grid, so the grid has already registered by the time it
    // resolves.
    const { container } = render(() => (
      <SnapGridGroup>
        <ResponsiveGridLayout {...stray} width={1400} layouts={layouts}>
          {() => <div />}
        </ResponsiveGridLayout>
        <Probe group="dashboard" />
      </SnapGridGroup>
    ));
    expect(probed(container, "dashboard")).toBe("false");
  });
});

describe("GridLayout render prop", () => {
  // A commit replaces every layout entry object (a drop does exactly this), so anything the
  // renderer reads must not be tracked by the tile's own render effect — else the tile's
  // content (and its resize handles' draggables) is torn down and rebuilt on every drop.
  it("keeps tile content and resize handles mounted across a commit", () => {
    let renders = 0;
    const [layout, setLayout] = createSignal<Layout>([{ i: "a", x: 0, y: 0, w: 1, h: 1 }]);
    const { container } = render(() => (
      <GridLayout layout={layout()} width={400}>
        {(item) => {
          renders++;
          // Reads `item()` eagerly, outside JSX.
          return item().static ? <b>locked</b> : <i class="card">{item().i}</i>;
        }}
      </GridLayout>
    ));
    const card = container.querySelector(".card");
    const handle = container.querySelector(".snapgrid-resize-handle");

    setLayout([{ i: "a", x: 1, y: 0, w: 1, h: 1 }]);

    expect(renders).toBe(1);
    expect(container.querySelector(".card")).toBe(card);
    expect(container.querySelector(".snapgrid-resize-handle")).toBe(handle);
  });

  // The flip side of the above: tiles bind their `group` once, so when the grid's id
  // changes the grid must remount them deliberately, not leave them on the old group.
  it("rebinds tiles to the new group when the grid id changes", () => {
    const [id, setId] = createSignal("before");
    let manager!: Manager;
    render(() => (
      <SnapGridGroup>
        <ManagerProbe
          onManager={(m) => {
            manager = m;
          }}
        />
        <GridLayout id={id()} layout={[{ i: "a", x: 0, y: 0, w: 1, h: 1 }]} width={400}>
          {(item) => <div>{item().i}</div>}
        </GridLayout>
      </SnapGridGroup>
    ));
    expect(manager.registry.draggables.get("a")?.data.snapGrid.group).toBe("before");

    setId("after");

    const tile = manager.registry.draggables.get("a");
    expect(tile?.group).toBe("after");
    expect(tile?.data.snapGrid.group).toBe("after");
  });
});

describe("useGridItem sortable payload", () => {
  // dnd-kit's Solid adapter syncs every input in ONE effect, so a payload that changes
  // identity on each reflow would re-run that whole effect for every moved tile per
  // pointer step. The payload stays put and reads the live item on demand.
  it("keeps the payload object stable while exposing the current item", () => {
    const [layout, setLayout] = createSignal<Layout>([{ i: "a", x: 0, y: 0, w: 1, h: 1 }]);
    let manager!: Manager;
    render(() => (
      <SnapGridGroup>
        <ManagerProbe
          onManager={(m) => {
            manager = m;
          }}
        />
        <GridLayout id="g" layout={layout()} width={400}>
          {(item) => <div>{item().i}</div>}
        </GridLayout>
      </SnapGridGroup>
    ));
    const before = manager.registry.draggables.get("a")?.data;

    setLayout([{ i: "a", x: 2, y: 0, w: 1, h: 1 }]);

    const after = manager.registry.draggables.get("a")?.data;
    expect(after).toBe(before);
    expect(after?.snapGrid.item).toMatchObject({ i: "a", x: 2 });
  });
});

describe("useResponsiveLayout", () => {
  const LAYOUTS: ResponsiveLayouts = {
    lg: [{ i: "a", x: 0, y: 0, w: 2, h: 1 }],
    xxs: [{ i: "a", x: 0, y: 0, w: 1, h: 1 }],
  };

  // A width change inside one breakpoint must not mint a new layout: each new layout is a
  // fresh clone, so it would republish the grid and re-key every tile on every pixel of a
  // window resize.
  it("keeps the same layout while the width stays within a breakpoint", () => {
    createRoot((dispose) => {
      const [width, setWidth] = createSignal(1400);
      const responsive = useResponsiveLayout(() => ({ width: width(), layouts: LAYOUTS }));
      const first = responsive.layout();

      setWidth(1300);
      expect(responsive.breakpoint()).toBe("lg");
      expect(responsive.layout()).toBe(first);

      setWidth(300);
      expect(responsive.breakpoint()).toBe("xxs");
      expect(responsive.layout()).not.toBe(first);
      dispose();
    });
  });
});
