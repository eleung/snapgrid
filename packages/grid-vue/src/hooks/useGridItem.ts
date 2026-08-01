import type { Plugins } from "@dnd-kit/abstract";
import { type Draggable, Feedback } from "@dnd-kit/dom";
import { OptimisticSortingPlugin } from "@dnd-kit/dom/sortable";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import { type UseSortableInput, useSortable } from "@dnd-kit/vue/sortable";
import { type LayoutItem, calcGridItemPosition } from "@snapgridjs/core";
import { type ComputedRef, computed, onScopeDispose, shallowRef, watch } from "vue";
import { useGridContext } from "../context.js";
import { type RefTarget, toElement } from "../element.js";
import { controllerTick } from "../reactivity.js";
import { REFLOW_EASING, REFLOW_MS, TILE_TRANSITION } from "../reflow.js";

// A pointer drag floats the tile via dnd-kit's default feedback; a keyboard drag gets
// `none` (no pointer — the tile steps in place via the session). The drop tween is
// disabled so a pointer drop lands at the cell, not the float origin.
const ITEM_FEEDBACK = [
  Feedback.configure({
    feedback: (_source: Draggable, manager) =>
      isKeyboardEvent(manager.dragOperation.activatorEvent) ? "none" : "default",
    dropAnimation: null,
  }),
];

// Drop the optimistic-sorting plugin (it reorders DOM nodes directly during a drag and
// fights Vue's `v-for` patcher, just as it fights Svelte's `{#each}` reconciler) and
// append the grid tile's feedback config.
const itemPlugins = (defaults: Plugins): Plugins => [
  ...defaults.filter((p) => p !== OptimisticSortingPlugin),
  ...ITEM_FEEDBACK,
];

// A grid tile is never itself a drop target — the grid CONTAINER (a separate,
// higher-priority droppable) is what a drag resolves onto. Keeping tiles out of the
// target pool also stops the sortable optimistic-sorting reparenting from fighting the
// framework's list reconciler.
const tileNeverTarget = () => null;

export interface UseGridItemOptions {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id, from its {@link useGridContainer} (dnd-kit's `group`). */
  group: string;
  /**
   * The dnd-kit sortable `type` this tile carries. Defaults to `"grid-item"`.
   * Override to namespace tiles for ecosystem interop. The grid recognizes its own
   * tiles by their payload, not this string, so any value still drags + crosses grids.
   */
  type?: string;
}

export interface GridItemHandle {
  /**
   * Function ref for the tile element: `<div :ref="tile.setRef">`. Feeds the sortable
   * and captures the node for the reflow FLIP.
   */
  setRef: (el: RefTarget) => void;
  /**
   * Optional drag-handle function ref. Bind it to a child element to restrict
   * **pointer** drag activation to that element; omit and the whole tile drags.
   * Keyboard pickup (Enter/Space on a focused tile) is unaffected.
   */
  setHandleRef: (el: RefTarget) => void;
  /** Reactive inline-style string (position + size). */
  style: ComputedRef<string>;
  /** True while this item is the active drag source. */
  isDragging: ComputedRef<boolean>;
  /** The item's current (possibly reflowed) layout entry. */
  item: ComputedRef<LayoutItem | undefined>;
}

/**
 * Headless composable for a single grid tile. The tile is a real `useSortable` (a
 * draggable + droppable carrying `group`/`index`/`type`), so it interoperates with the
 * dnd-kit sortable ecosystem, yet it is positioned by RGL via the controller. `group`
 * is the owning grid's id (from its {@link useGridContainer}).
 *
 * The dragged tile floats itself via dnd-kit's default feedback (no drag overlay): the
 * active tile renders at its committed origin and dnd-kit's float follows the pointer,
 * while reflow is animated on the compositor via the Web Animations API (a FLIP) —
 * both so it stays smooth in Safari. Tiles rest on `left`/`top` (not `transform`) so
 * the float hands off cleanly when a tile is swapped for a foreign one mid-drag
 * (grid → sortable interop).
 *
 * `id` and `group` are read once at setup and are expected to be immutable for the
 * tile's lifetime (tiles are keyed by `i`, and a grid's id is stable). Changing the
 * owning grid's `id` prop while its tiles stay mounted would leave them bound to the old
 * group — mirroring the Svelte binding. Give a remounted grid a fresh `key` if its id
 * must change.
 *
 * Must be called during component setup, inside a grid container.
 */
export function useGridItem(opts: UseGridItemOptions): GridItemHandle {
  const { id, group, type = "grid-item" } = opts;
  const { controller, version } = useGridContext(group);
  const tick = controllerTick(controller);

  const elRef = shallowRef<HTMLElement | null>(null);
  const handleElRef = shallowRef<HTMLElement | null>(null);

  // This item's slice — re-read on drag-state changes (tick) and config/committed
  // republish (version). A drag elsewhere still recomputes the computed, but the
  // controller's value-cached snapshot returns a stable reference when nothing in this
  // item's slice changed, so downstream computeds don't churn.
  const snap = computed(() => {
    version();
    tick();
    return controller.itemSnapshot(id);
  });
  const session = computed(() => {
    tick();
    return controller.getSession();
  });

  const item = computed(() => snap.value.item);
  const active = computed(() => snap.value.isDragging);
  // The "pointer move in progress" signal (false for a keyboard drag): used to pin the
  // tile at its origin for the float, not to hide it (it floats itself).
  const hidden = computed(() => snap.value.hidden);
  const dragging = computed(() => session.value != null);

  // Stable-ish drag payload; `group` lets the engine resolve this tile's owning grid.
  const data = computed(() => ({
    snapGrid: { kind: "move", itemId: id, item: item.value, group },
  }));

  // During a POINTER drag the active tile renders at its committed origin so dnd-kit's
  // float offset tracks the pointer; a keyboard drag (and every other tile) renders at
  // the reflowed (preview) cell so it steps with the arrow keys.
  const posItem = computed(() => {
    version();
    const it = item.value;
    if (!it) return undefined;
    return active.value && hidden.value ? (session.value?.anchor.item ?? it) : it;
  });
  const pos = computed(() => {
    version();
    const pi = posItem.value;
    if (!pi) return undefined;
    const config = controller.config;
    if (!config) return undefined;
    return calcGridItemPosition(config.positionParams, pi.x, pi.y, pi.w, pi.h);
  });

  const sortable = useSortable({
    id,
    // itemIndex(id) is assigned once and stable for this tile's life (config- and
    // drag-independent), so no reactive dep is read here — a spurious one would re-run
    // the sortable's index effect (refreshShape) on every unrelated republish.
    index: () => controller.itemIndex(id),
    group,
    type,
    accept: type,
    // `collisionDetector` and the `plugins` callback are themselves FUNCTIONS, and
    // dnd-kit's Vue adapter resolves every input with `toValue()` — which invokes a
    // bare function as a getter. Wrap them so `toValue` yields the function itself.
    collisionDetector: () => tileNeverTarget,
    // `Customizable<Plugins>` already includes the `(defaults) => Plugins` callback
    // form, so "a getter that RETURNS the callback" is inexpressible in the input type.
    // Escape this one field only; every other option below stays typechecked.
    plugins: (() => itemPlugins) as unknown as UseSortableInput["plugins"],
    disabled: () => {
      version();
      return !controller.config?.isItemDraggable(id);
    },
    sensors: () => {
      version();
      return controller.config?.itemSensors;
    },
    modifiers: () => {
      version();
      return controller.config?.itemModifiers;
    },
    // Carry the full item so a receiving grid can render/insert it on a cross-grid drop.
    data,
    element: elRef,
    handle: handleElRef,
  });

  const setRef = (el: RefTarget): void => {
    elRef.value = toElement(el);
  };
  const setHandleRef = (el: RefTarget): void => {
    handleElRef.value = toElement(el);
  };

  // True on the single update where the tile goes active → settled (the drop frame):
  // snap to the landed cell instead of sliding there from the committed origin.
  // Recomputed on any positional/drag change (the Vue analog of "every render"), so it
  // is set only on the frame the tile stops being the drag source and cleared on the
  // next change regardless of its cause.
  let wasActive = false;
  const justDropped = shallowRef(false);
  watch(
    [active, dragging, pos],
    () => {
      const a = active.value;
      justDropped.value = wasActive && !a;
      wasActive = a;
    },
    { flush: "pre", immediate: true },
  );

  // Reflow a tile to its new cell via a compositor FLIP: the resting left/top has
  // already jumped this update, so animate a `transform` delta from the tile's previous
  // visual position back to 0. Drives in-drag reflow AND out-of-drag (responsive /
  // programmatic) changes, and dodges the float's popover repaint that janks a CSS
  // transition in Safari. The drag source settling after a drop is the exception (see
  // the `settleAnchor` branch).
  let prev: { left: number; top: number } | null = null;
  let reflowAnim: Animation | null = null;
  let settleAnchor: { left: number; top: number } | null = null;
  watch(
    [pos, active, dragging, justDropped],
    () => {
      const p = pos.value;
      const cur = p ? { left: p.left, top: p.top } : null;
      const isActive = active.value;
      const isDragging = dragging.value;
      const dropped = justDropped.value;
      const before = prev;
      prev = cur;
      const el = elRef.value;
      if (!el || !cur) return;

      // Active: dnd-kit owns this tile's motion. Remember the cell it floats from so the
      // post-drop settle can snap instead of FLIP.
      if (isActive) {
        settleAnchor = cur;
        reflowAnim?.cancel();
        return;
      }
      // A drag of ANOTHER tile in this grid: this tile reflows normally; drop any stale
      // settle anchor so it FLIPs (it was never floated).
      if (isDragging) {
        settleAnchor = null;
      }
      // Post-drop settle of the formerly-active source: it was floated, so `before` is
      // the committed origin, not where it visually was — snap (no FLIP) until the
      // committed move lands (cell leaves the anchor).
      else if (settleAnchor) {
        const a = settleAnchor;
        reflowAnim?.cancel();
        if (cur.left !== a.left || cur.top !== a.top) settleAnchor = null;
        return;
      }

      if (!before || dropped) return;
      if (before.left === cur.left && before.top === cur.top) return;
      // Web Animations API may be absent (jsdom / SSR / very old browsers): degrade to
      // an instant move (the left/top already places the tile) rather than throw.
      if (typeof el.animate !== "function") return;
      // Previous visual position = the prior resting cell plus any in-flight transform.
      let fromX = before.left;
      let fromY = before.top;
      if (reflowAnim?.playState === "running") {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        fromX = before.left + m.m41;
        fromY = before.top + m.m42;
      }
      reflowAnim?.cancel();
      reflowAnim = el.animate(
        [
          { transform: `translate(${fromX - cur.left}px, ${fromY - cur.top}px)` },
          { transform: "translate(0px, 0px)" },
        ],
        { duration: REFLOW_MS, easing: REFLOW_EASING },
      );
    },
    { flush: "post", immediate: true },
  );

  // Cancel any in-flight reflow animation when the tile unmounts (e.g. removed mid-drag
  // during a cross-grid move) so a running Animation can't outlive its node.
  onScopeDispose(() => reflowAnim?.cancel());

  // Tiles rest on left/top (see the doc above); position animates via the FLIP, so the
  // CSS transition is SIZE-only — and "none" while dragging (FLIP owns motion) or
  // just-dropped (it snaps).
  const style = computed(() => {
    const p = pos.value;
    if (!p) return "position: absolute; touch-action: none;";
    const transition = justDropped.value || dragging.value ? "none" : TILE_TRANSITION;
    return `position: absolute; left: ${p.left}px; top: ${p.top}px; width: ${p.width}px; height: ${p.height}px; transition: ${transition}; touch-action: none;`;
  });

  return {
    setRef,
    setHandleRef,
    style,
    isDragging: computed(() => sortable.isDragging.value === true),
    item,
  };
}
