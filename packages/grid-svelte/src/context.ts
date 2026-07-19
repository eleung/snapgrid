import type { GridController } from "@snapgridjs/dnd";
import { getContext, hasContext, setContext } from "svelte";

// Grid context published by a container ({@link createGridContainer}) and read by
// the tiles/placeholder/resize handles rendered inside it. Carries the controller
// plus a reactive `version` tick the container bumps whenever it republishes config
// or the committed layout — the Svelte stand-in for React re-rendering the subtree
// on a prop change. (The controller's own `subscribe` only fires on drag-state
// changes; `setConfig`/`setCommitted` deliberately don't emit, so items depend on
// this tick to re-read geometry after a width/layout change.)
const GRID_KEY = Symbol("snapgrid.grid");

// Marks that a snapgrid-managed <DragDropProvider> already exists above, so a nested
// or sibling grid doesn't mint a second dnd-kit manager. Mirrors the React binding's
// `InProvider` context (the cross-grid / nesting seam).
const IN_PROVIDER_KEY = Symbol("snapgrid.inProvider");

export interface GridContext {
  controller: GridController;
  /**
   * Reactive tick. Read it inside a `$derived`/`$effect` to depend on the
   * container republishing config or the committed layout.
   */
  version: () => number;
}

export function setGridContext(ctx: GridContext): void {
  setContext(GRID_KEY, ctx);
}

/**
 * The nearest enclosing grid's context. Throws a helpful error when a tile is
 * rendered outside any grid (almost always a missing container, or a tile placed
 * outside its `createGridContainer` / `<GridLayout>`).
 */
export function getGridContext(group?: string): GridContext {
  const ctx = getContext<GridContext | undefined>(GRID_KEY);
  if (!ctx) {
    throw new Error(
      `snapgrid: no grid found${group ? ` for group "${group}"` : ""}. A grid item must be rendered inside a grid created by createGridContainer (or a <GridLayout>).`,
    );
  }
  return ctx;
}

export function markInProvider(): void {
  setContext(IN_PROVIDER_KEY, true);
}

export function isInProvider(): boolean {
  return hasContext(IN_PROVIDER_KEY);
}
