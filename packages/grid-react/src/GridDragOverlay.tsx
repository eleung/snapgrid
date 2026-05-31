import type { LayoutItem } from "@snapgridjs/core";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useGridDragOverlay } from "./hooks/useGridDragOverlay.js";

export interface GridDragOverlayProps {
  /** Render the floating preview for the dragged item. */
  children: (item: LayoutItem) => ReactNode;
  /** Appended to the default `snapgrid-overlay` class on the portal element. */
  className?: string;
  /** Merged over the positioning style. */
  style?: CSSProperties;
}

/**
 * Renders the floating drag preview in a portal at `document.body` — so it
 * follows the pointer across grids without being clipped by any container.
 * Renders nothing when this grid isn't the drag source.
 */
export function GridDragOverlay({ children, className, style }: GridDragOverlayProps) {
  const overlay = useGridDragOverlay();
  if (typeof document === "undefined" || !overlay) return null;
  return createPortal(
    <div
      className={className ? `snapgrid-overlay ${className}` : "snapgrid-overlay"}
      style={style ? { ...overlay.style, ...style } : overlay.style}
    >
      {children(overlay.item)}
    </div>,
    document.body,
  );
}
