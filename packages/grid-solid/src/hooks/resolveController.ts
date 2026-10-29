import type { GridController } from "@snapgridjs/dnd";
import { useGridContext } from "../context.js";

/**
 * Resolve a grid's controller by its `group` (= the grid's id) from the registry, scoped
 * to the ambient dnd-kit manager. The container registered the controller under that id.
 * Throws a helpful error if unresolved.
 *
 * For advanced/registry-based composition — {@link useGridItem} and friends resolve
 * through the same registry. Must be called in a component rendered inside a
 * `<DragDropProvider>`.
 */
export function resolveController(group: string): GridController {
  return useGridContext(group).controller;
}
