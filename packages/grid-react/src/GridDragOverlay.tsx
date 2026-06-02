import type { Draggable, DropAnimation } from "@dnd-kit/dom";
import { DragOverlay } from "@dnd-kit/react";
import type { LayoutItem } from "@snapgridjs/core";
import type { CSSProperties, ReactNode } from "react";
import type { SnapGridDragData } from "./context.js";
import { dragOverlayStyle } from "./dragOverlayStyle.js";

/** What {@link GridDragOverlay}'s render prop receives. */
export interface GridDragOverlayContext {
  /**
   * The dragged grid item, resolved from the drag source — so you can render the
   * floating preview without looking it up by `source.id`. It's the item's entry
   * at drag start (size/label are stable through a move). `null` when the source
   * is an external, non-grid draggable (e.g. a palette chip) — branch on
   * `source` to render those.
   */
  item: LayoutItem | null;
  /**
   * The raw dnd-kit drag source. Branch on `source.id` / `source.data` to render
   * the right preview for external or cross-grid drags when several grids (or a
   * palette) share one provider.
   */
  source: Draggable;
}

export interface GridDragOverlayProps {
  /** Render the floating preview from the resolved `item` (and/or raw `source`). */
  children: (context: GridDragOverlayContext) => ReactNode;
  /** Merged over the built-in out-of-flow base ({@link dragOverlayStyle}). */
  style?: CSSProperties;
  /** Forwarded to dnd-kit's `<DragOverlay>`. */
  className?: string;
  /** Forwarded to dnd-kit's `<DragOverlay>` — drop-animation control. */
  dropAnimation?: DropAnimation | null;
  /** Forwarded to dnd-kit's `<DragOverlay>` — the overlay element's tag. */
  tag?: string;
  /** Forwarded to dnd-kit's `<DragOverlay>`. */
  disabled?: boolean | ((source: Draggable | null) => boolean);
}

/** Read the resolved layout item off a drag source (move drags carry it). */
function sourceItem(source: Draggable | null | undefined): LayoutItem | null {
  const data = source?.data as { snapGrid?: SnapGridDragData } | undefined;
  const snap = data?.snapGrid;
  return snap?.kind === "move" ? snap.item : null;
}

/**
 * Grid-aware drag overlay — a thin wrapper over dnd-kit's {@link DragOverlay}
 * that removes two papercuts of using it with a grid:
 *
 *  1. **Out of flow by default.** It bakes in {@link dragOverlayStyle}, so the
 *     overlay can't flash full-width at the bottom of the grid in the frame
 *     before dnd-kit positions it. (You can still merge your own `style`.)
 *  2. **Item resolved for you.** The render prop receives `{ item, source }`
 *     instead of a raw source, so you skip the `source.id` → item lookup.
 *
 * Render presentational markup (never `useGridItem`) keyed off `item` / `source`.
 * dnd-kit's own `!important` rules still drive the live drag position, so the
 * baked style only matters in the in-between frame. Reach for the raw
 * {@link DragOverlay} if you want dnd-kit's exact `(source) => …` API.
 *
 * `<GridLayout>` renders its own overlay; this is for the headless layer.
 */
export function GridDragOverlay({ children, style, ...rest }: GridDragOverlayProps): ReactNode {
  return (
    <DragOverlay style={style ? { ...dragOverlayStyle, ...style } : dragOverlayStyle} {...rest}>
      {(source) => children({ item: sourceItem(source), source })}
    </DragOverlay>
  );
}
