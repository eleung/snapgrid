import type { GridController } from "@snapgridjs/dnd";
import { type Accessor, createSignal, onCleanup } from "solid-js";

/**
 * Bridge {@link GridController.subscribe} (a plain observable — the React binding
 * consumes it via `useSyncExternalStore`) into Solid reactivity. Returns an accessor
 * that, when read inside a memo/effect, re-runs on every controller emit (i.e.
 * drag-state changes: `setSession` / `setKeyboard`). Combine it with the container's
 * `version` tick (config/committed republish) to cover all the inputs a tile's
 * rendered position depends on.
 *
 * Created ONCE per grid (by its container) and shared by every tile, handle and
 * placeholder through the grid context: each signal write is its own synchronous Solid
 * flush (the controller's emit loop isn't batched), so one tick per subscriber would cost
 * one update cycle per subscriber on every pointer move.
 *
 * Subscribes eagerly, so no emit can land between the first read and the subscription.
 * Cleanup rides the owning reactive scope (the container's).
 */
export function createControllerTick(controller: GridController): Accessor<number> {
  const [tick, setTick] = createSignal(0);
  // Assign from a plain counter so every emit is a fresh value (and so notifies).
  let count = 0;
  onCleanup(controller.subscribe(() => setTick(++count)));
  return tick;
}
