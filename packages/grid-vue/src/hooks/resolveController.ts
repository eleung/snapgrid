import { useDragDropManager } from "@dnd-kit/vue";
import { type GridController, getController } from "@snapgridjs/dnd";

/**
 * Resolve a grid's controller by its `group` (= the grid's id) from the registry,
 * scoped to the ambient dnd-kit manager. The container registered the controller under
 * that id. Throws a helpful error if unresolved.
 *
 * Prefer this for advanced/registry-based resolution; tiles created with
 * {@link useGridItem} resolve their controller through Vue's provide/inject instead (so
 * config changes stay reactive). Must be called during component setup, in a child of a
 * `<DragDropProvider>`.
 */
export function resolveController(group: string): GridController {
  const manager = useDragDropManager();
  const controller = getController(manager.value, group);
  if (!controller) {
    throw new Error(
      `snapgrid: no grid found for group "${group}". A grid item must pass the group returned by its grid's useGridContainer, and render inside a <DragDropProvider> (or use <GridLayout>, which wires this for you).`,
    );
  }
  return controller;
}
