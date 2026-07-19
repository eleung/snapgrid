import type { GridController } from "@snapgridjs/dnd";

/**
 * Bridge {@link GridController.subscribe} (a plain observable — the React binding
 * consumes it via `useSyncExternalStore`) into Svelte reactivity. Returns a getter
 * that, when read inside a `$derived`/`$effect`, re-runs on every controller emit
 * (i.e. drag-state changes: `setSession` / `setKeyboard`). Combine it with the
 * container's `version` tick (config/committed republish) to cover all the inputs a
 * tile's rendered position depends on.
 *
 * Must be called during component initialization (it registers an `$effect`).
 */
export function controllerTick(controller: GridController): () => number {
  let tick = $state(0);
  $effect(() => controller.subscribe(() => tick++));
  return () => tick;
}
