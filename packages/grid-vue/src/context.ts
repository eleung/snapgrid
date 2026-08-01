import type { GridController } from "@snapgridjs/dnd";
import { type InjectionKey, inject, provide } from "vue";

// Grid context published by a container ({@link useGridContainer}) and read by the
// tiles/placeholder/resize handles rendered inside it. Carries the controller plus a
// reactive `version` tick the container bumps whenever it republishes config or the
// committed layout — the Vue stand-in for React re-rendering the subtree on a prop
// change. (The controller's own `subscribe` only fires on drag-state changes;
// `setConfig`/`setCommitted` deliberately don't emit, so items depend on this tick to
// re-read geometry after a width/layout change.)
const GRID_KEY: InjectionKey<GridContext> = Symbol("snapgrid.grid");

// Marks that a snapgrid-managed <DragDropProvider> already exists above, so a nested
// or sibling grid doesn't mint a second dnd-kit manager. Mirrors the React binding's
// `InProvider` context (the cross-grid / nesting seam).
const IN_PROVIDER_KEY: InjectionKey<boolean> = Symbol("snapgrid.inProvider");

export interface GridContext {
  controller: GridController;
  /**
   * Reactive tick. Read it inside a `computed`/`watch` to depend on the container
   * republishing config or the committed layout.
   */
  version: () => number;
}

export function provideGridContext(ctx: GridContext): void {
  provide(GRID_KEY, ctx);
}

/**
 * The **nearest enclosing** grid's context. Throws a helpful error when a tile is
 * rendered outside any grid (almost always a missing container, or a tile placed
 * outside its `useGridContainer` / `<GridLayout>`).
 *
 * `group` is used only to word that error — resolution is by DOM/component ancestry,
 * not by id. A tile rendered inside grid A while declaring `group: "B"` therefore reads
 * A's controller for its position while telling dnd-kit it belongs to B. Use
 * {@link resolveController} for id-keyed lookup against the registry.
 *
 * NB: Vue resolves `inject` from the PARENT chain, so a component cannot read a context
 * it provided itself — the container passes its own controller/version around directly
 * rather than injecting them back.
 */
export function useGridContext(group?: string): GridContext {
  const ctx = inject(GRID_KEY, undefined);
  if (!ctx) {
    throw new Error(
      `snapgrid: no grid found${group ? ` for group "${group}"` : ""}. A grid item must be rendered inside a grid created by useGridContainer (or a <GridLayout>).`,
    );
  }
  return ctx;
}

export function markInProvider(): void {
  provide(IN_PROVIDER_KEY, true);
}

export function useIsInProvider(): boolean {
  return inject(IN_PROVIDER_KEY, false);
}
