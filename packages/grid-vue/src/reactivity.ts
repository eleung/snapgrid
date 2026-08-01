import type { GridController } from "@snapgridjs/dnd";
import { onScopeDispose, shallowRef } from "vue";

/**
 * Bridge {@link GridController.subscribe} (a plain observable — the React binding
 * consumes it via `useSyncExternalStore`) into Vue reactivity. Returns a getter that,
 * when read inside a `computed`/`watch`, re-runs on every controller emit (i.e.
 * drag-state changes: `setSession` / `setKeyboard`). Combine it with the container's
 * `version` tick (config/committed republish) to cover all the inputs a tile's
 * rendered position depends on.
 *
 * Unlike the Svelte binding — which subscribes inside an `$effect`, so the first
 * paint precedes the subscription — this subscribes eagerly during setup, closing
 * that gap. Cleanup rides the component's effect scope.
 *
 * Must be called during component setup (it registers a scope-disposal hook).
 */
export function controllerTick(controller: GridController): () => number {
  const tick = shallowRef(0);
  // Assign from a plain counter rather than `tick.value++`: a read-modify-write would
  // track `tick` as a dependency if a notification ever landed inside a tracked
  // effect. A bare write only triggers.
  let count = 0;
  onScopeDispose(
    controller.subscribe(() => {
      tick.value = ++count;
    }),
  );
  return () => tick.value;
}
