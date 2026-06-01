import {
  type Draggable,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
  type Sensors,
} from "@dnd-kit/dom";
import { isKeyboardEvent } from "@dnd-kit/dom/utilities";
import type { DragConfig } from "../types.js";

/** Marker attribute placed on resize-handle elements. */
export const RESIZE_HANDLE_ATTR = "data-snapgrid-resize-handle";

// Pointer drags float a clone in dnd-kit's <DragOverlay> (the in-grid tile
// hides) and produce the moving shape the collision observer needs. Keyboard
// drags get `none`: there's no pointer, so the tile stays visible and steps in
// place — a clone would freeze at the origin. Module-level for stable identity.
export const ITEM_FEEDBACK = [
  Feedback.configure({
    feedback: (_source: Draggable, manager) =>
      isKeyboardEvent(manager.dragOperation.activatorEvent) ? "none" : "clone",
  }),
];

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
      activationConstraints: () =>
        threshold > 0
          ? [new PointerActivationConstraints.Distance({ value: threshold })]
          : undefined,
      preventActivation: (event: PointerEvent) =>
        shouldPreventItemDrag(event.target, getDragConfig()),
    }),
    KeyboardSensor,
  ];
}
