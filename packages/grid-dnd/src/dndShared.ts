import type { ActivationConstraints } from "@dnd-kit/abstract";
import {
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
  type Sensors,
} from "@dnd-kit/dom";
import type { DragConfig } from "./types.js";

/** Marker attribute placed on resize-handle elements. */
export const RESIZE_HANDLE_ATTR = "data-snapgrid-resize-handle";

// Touch hold (ms) before an item drag arms when `dragConfig.touchHold` is unset —
// dnd-kit's own touch default, which a flat `threshold` would otherwise replace.
export const DEFAULT_TOUCH_HOLD = 250;

// Pixels a finger may drift before a hold counts as a scroll rather than a drag.
export const TOUCH_HOLD_TOLERANCE = 5;

// Resize handles are draggables too, but resizing isn't a move — there's no tile
// to float — so they suppress dnd-kit's visual feedback entirely.
export const NO_FEEDBACK = [Feedback.configure({ feedback: "none" })];

/**
 * Whether a pointer-down on `target` should NOT start an item move. Pure and
 * exported for testing. Honors three rules, in order:
 *  - never start a move from a resize handle;
 *  - never start from a region matching `dragConfig.cancel`;
 *  - if `dragConfig.handle` is set, only start from within it.
 */
export function shouldPreventItemDrag(
  target: EventTarget | null,
  cfg: DragConfig | undefined,
): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(`[${RESIZE_HANDLE_ATTR}]`)) return true;
  if (cfg?.cancel && target.closest(cfg.cancel)) return true;
  if (cfg?.handle && !target.closest(cfg.handle)) return true;
  return false;
}

/**
 * How a pointer arms an item drag: a touch holds first (a finger that travels is
 * scrolling — the tile's `touch-action: pan-y` already gave that gesture to the
 * browser), every other pointer uses the distance threshold. Pure, exported for
 * testing. `undefined` is "no constraint" — dnd-kit activates on pointer-down.
 */
export function buildActivationConstraints(
  pointerType: string,
  threshold: number,
  cfg: DragConfig | undefined,
): ActivationConstraints<PointerEvent> | undefined {
  if (pointerType === "touch") {
    const hold = cfg?.touchHold ?? DEFAULT_TOUCH_HOLD;
    // `touchHold: 0` deliberately falls through to the distance threshold below.
    if (hold > 0) {
      return [
        new PointerActivationConstraints.Delay({
          value: hold,
          tolerance: TOUCH_HOLD_TOLERANCE,
        }),
      ];
    }
  }
  return threshold > 0
    ? [new PointerActivationConstraints.Distance({ value: threshold })]
    : undefined;
}

/**
 * Sensors for item (move) draggables, built from the drag config: a distance
 * activation threshold (so clicks don't start drags) plus handle/cancel/resize
 * gating, with the keyboard sensor kept for accessibility.
 */
export function buildItemSensors(
  threshold: number,
  getDragConfig: () => DragConfig | undefined,
): Sensors {
  return [
    PointerSensor.configure({
      activationConstraints: (event: PointerEvent) =>
        buildActivationConstraints(event.pointerType, threshold, getDragConfig()),
      preventActivation: (event: PointerEvent) =>
        shouldPreventItemDrag(event.target, getDragConfig()),
    }),
    KeyboardSensor,
  ];
}
