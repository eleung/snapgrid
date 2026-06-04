import { Modifier } from "@dnd-kit/abstract";
import type { DragDropManager } from "@dnd-kit/dom";
import { type PositionParams, calcGridColWidth } from "@snapgridjs/core";

export interface SnapToGridOptions {
  /** Current geometry (changes with container width). Read fresh each apply(). */
  getPositionParams: () => PositionParams;
  /** Whether snapping is currently enabled (dragConfig.snapToGrid). */
  isEnabled: () => boolean;
}

/**
 * Quantizes the dragged item's transform to whole grid cells, so the floating
 * <DragOverlay> clone jumps cell-to-cell in lockstep with the (always-snapped)
 * placeholder instead of tracking the pointer smoothly. Applied on the item
 * draggable; a no-op unless `dragConfig.snapToGrid` is set.
 */
export class SnapToGrid extends Modifier<DragDropManager, SnapToGridOptions> {
  override apply({ transform }: DragDropManager["dragOperation"]) {
    const opts = this.options;
    if (!opts?.isEnabled()) return transform;
    const pp = opts.getPositionParams();
    // A cell step is the column/row size plus the gap to the next cell.
    const colStep = calcGridColWidth(pp) + pp.margin[0];
    const rowStep = pp.rowHeight + pp.margin[1];
    if (colStep <= 0 || rowStep <= 0) return transform; // guard degenerate geometry
    return {
      x: Math.round(transform.x / colStep) * colStep,
      y: Math.round(transform.y / rowStep) * rowStep,
    };
  }
}
