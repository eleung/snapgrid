import type { ResizeHandleAxis } from "@snapgridjs/core";
import { type CSSProperties, type ReactNode, memo } from "react";
import { useGridItem } from "./hooks/useGridItem.js";
import { useGridResizeHandle } from "./hooks/useGridResizeHandle.js";
import { useResolveController } from "./hooks/useResolveController.js";

export interface GridItemProps {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id (from its useGridContainer). */
  group: string;
  children: ReactNode;
  /** Appended to the default `snapgrid-item` class. */
  className?: string;
  /** Merged over (and able to override) the positioning style. */
  style?: CSSProperties;
}

const HANDLE_CURSOR: Record<ResizeHandleAxis, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  se: "nwse-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
};

const SIDE = 14;
function handleStyle(handle: ResizeHandleAxis): CSSProperties {
  const s: CSSProperties = {
    position: "absolute",
    width: SIDE,
    height: SIDE,
    cursor: HANDLE_CURSOR[handle],
    touchAction: "none",
    zIndex: 4,
  };
  if (handle.includes("n")) s.top = -SIDE / 2;
  if (handle.includes("s")) s.bottom = -SIDE / 2;
  if (handle.includes("e")) s.right = -SIDE / 2;
  if (handle.includes("w")) s.left = -SIDE / 2;
  if (handle === "n" || handle === "s") {
    s.left = `calc(50% - ${SIDE / 2}px)`;
  }
  if (handle === "e" || handle === "w") {
    s.top = `calc(50% - ${SIDE / 2}px)`;
  }
  return s;
}

function DefaultResizeHandle({
  itemId,
  handle,
  group,
}: { itemId: string; handle: ResizeHandleAxis; group: string }) {
  const { ref, handleProps } = useGridResizeHandle(itemId, handle, group);
  return (
    <span
      ref={ref}
      {...handleProps}
      className={`snapgrid-resize-handle snapgrid-resize-handle--${handle}`}
      style={handleStyle(handle)}
    />
  );
}

/**
 * Convenience wrapper over {@link useGridItem}: an absolutely-positioned `<div>`
 * with stable hooks (`.snapgrid-item`, `data-grid-id`, `data-dragging`) and the
 * configured resize handles. `group` is the owning grid's id. For full control,
 * use the hooks directly.
 *
 * Memoized so re-rendering the surface (e.g. its auto-height tracking the drag)
 * doesn't re-render every tile — a tile re-renders only when its own slice
 * changes (via useGridItem's subscription). Keeps a drag's React work scoped to
 * the moved tile (see renderScope.test).
 */
function GridItemImpl({ id, group, children, className, style }: GridItemProps) {
  const controller = useResolveController(group);
  const { ref, style: positionStyle, isDragging } = useGridItem(id, group);
  const config = controller.config;
  const handles = config?.isItemResizable(id) ? config.resizeHandlesFor(id) : [];
  return (
    <div
      ref={ref}
      data-grid-id={id}
      data-dragging={isDragging || undefined}
      className={className ? `snapgrid-item ${className}` : "snapgrid-item"}
      style={style ? { ...positionStyle, ...style } : positionStyle}
    >
      {children}
      {handles.map((handle) => (
        <DefaultResizeHandle key={handle} itemId={id} handle={handle} group={group} />
      ))}
    </div>
  );
}

export const GridItem = memo(GridItemImpl);
