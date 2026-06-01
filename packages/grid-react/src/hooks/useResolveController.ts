import { useDragDropManager } from "@dnd-kit/react";
import type { GridController } from "../controller/GridController.js";
import { getController } from "../controller/registry.js";

/**
 * Resolve a grid's controller by its `group` (= the grid's id), scoped to the
 * ambient dnd-kit manager. Items declare `group` (mirroring useSortable); the
 * container registered the controller under that id. Throws a helpful error if
 * unresolved — almost always a missing `group` or a tile rendered outside any
 * grid / `DragDropProvider`.
 */
export function useResolveController(group: string): GridController {
  const manager = useDragDropManager();
  const controller = getController(manager, group);
  if (!controller) {
    throw new Error(
      `snapgrid: no grid found for group "${group}". A grid item must pass the group returned by its grid's useGridContainer, and render inside a <DragDropProvider> (or use <GridLayout>, which wires this for you).`,
    );
  }
  return controller;
}
