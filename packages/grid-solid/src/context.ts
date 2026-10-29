import { useDragDropManager } from "@dnd-kit/solid";
import { type GridController, getController } from "@snapgridjs/dnd";
import { type Accessor, createContext, useContext } from "solid-js";

// Marks that a snapgrid-managed <DragDropProvider> already exists above, so a nested
// or sibling grid doesn't mint a second dnd-kit manager. Mirrors the React binding's
// `InProvider` context (the cross-grid / nesting seam).
export const InProviderContext = createContext(false);

export function useIsInProvider(): boolean {
  return useContext(InProviderContext);
}

/** A grid's two reactive ticks, owned by its container and shared by everything inside. */
export interface GridSignals {
  /**
   * Bumped whenever the container republishes config or the committed layout — the Solid
   * stand-in for React re-rendering the subtree on a prop change. (The controller's own
   * `subscribe` only fires on drag-state changes; `setConfig`/`setCommitted` deliberately
   * don't emit, so tiles depend on this to re-read geometry after a width/layout change.)
   */
  version: Accessor<number>;
  /** Bumped on every controller emit (drag-state changes). See `createControllerTick`. */
  tick: Accessor<number>;
}

/** A grid's controller plus its {@link GridSignals}. */
export interface GridContext extends GridSignals {
  controller: GridController;
}

// Solid has no imperative `provide()` — context is set by rendering a Provider component,
// which a headless container hook can't do for the tiles its caller renders. So tiles
// resolve their controller by `group` from the registry (like the React binding), and the
// container's reactive ticks ride alongside it in this side table.
const signals = new WeakMap<GridController, GridSignals>();

export function publishGridSignals(controller: GridController, gridSignals: GridSignals): void {
  signals.set(controller, gridSignals);
}

const constant: Accessor<number> = () => 0;
const noSignals: GridSignals = { version: constant, tick: constant };

/**
 * Resolve a grid's controller by its `group` (= the grid's id), scoped to the ambient
 * dnd-kit manager, together with its reactive ticks. Throws a helpful error when
 * unresolved — almost always a missing `group` or a tile rendered outside any grid /
 * `DragDropProvider`.
 */
export function useGridContext(group: string): GridContext {
  const controller = getController(useDragDropManager(), group);
  if (!controller) {
    throw new Error(
      `snapgrid: no grid found for group "${group}". A grid item must pass the group returned by its grid's useGridContainer, and render inside a <DragDropProvider> (or use <GridLayout>, which wires this for you).`,
    );
  }
  return { controller, ...(signals.get(controller) ?? noSignals) };
}
