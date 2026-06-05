import type { GridController } from "./GridController.js";

/**
 * Resolves a grid's {@link GridController} by its id, scoped to the dnd-kit
 * manager the grid is registered with. A container registers its controller
 * here (during render, so child items resolve it on their first render); items
 * look it up by their `group` (= the grid id). Replaces the old geometry
 * `GridRegistry` — which grid the pointer is over now comes from the collision
 * target, so the registry's only job is id → controller resolution.
 *
 * Keyed by manager so two apps (or two providers) never collide, and grids in
 * one provider share a map (the cross-grid seam).
 */
const byManager = new WeakMap<object, Map<string, GridController>>();
// Used when there is no manager yet (no <DragDropProvider> above) — degenerate
// but keeps lookups total instead of throwing.
const noManager = new Map<string, GridController>();

function mapFor(manager: object | null | undefined): Map<string, GridController> {
  if (!manager) return noManager;
  let map = byManager.get(manager);
  if (!map) {
    map = new Map();
    byManager.set(manager, map);
  }
  return map;
}

/** Register a controller under `id` for `manager`. Returns an unregister fn. */
export function registerController(
  manager: object | null | undefined,
  id: string,
  controller: GridController,
): () => void {
  const map = mapFor(manager);
  map.set(id, controller);
  return () => {
    if (map.get(id) === controller) map.delete(id);
  };
}

/** The controller registered under `id` for `manager`, or undefined. */
export function getController(
  manager: object | null | undefined,
  id: string,
): GridController | undefined {
  return mapFor(manager).get(id);
}

// The active drag's grab offset (pointer position within the dragged tile),
// shared across grids on the same manager so a *receiving* grid maps the pointer
// to the cell under the grabbed point, not the tile's corner. One drag at a time
// per manager, so a single slot keyed by manager suffices.
const grabOffsets = new WeakMap<object, { x: number; y: number }>();
const noManagerGrab = { current: null as { x: number; y: number } | null };

export function setGrabOffset(
  manager: object | null | undefined,
  offset: { x: number; y: number } | null,
): void {
  if (!manager) {
    noManagerGrab.current = offset;
    return;
  }
  if (offset) grabOffsets.set(manager, offset);
  else grabOffsets.delete(manager);
}

export function getGrabOffset(manager: object | null | undefined): { x: number; y: number } {
  const offset = manager ? grabOffsets.get(manager) : noManagerGrab.current;
  return offset ?? { x: 0, y: 0 };
}
