import type { ResizeHandleAxis } from "@snapgridjs/core";
import type { JSX } from "solid-js";

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

/** Inline style object positioning a default resize handle on its edge/corner. */
export function handleStyle(handle: ResizeHandleAxis): JSX.CSSProperties {
  const style: JSX.CSSProperties = {
    position: "absolute",
    width: `${SIDE}px`,
    height: `${SIDE}px`,
    cursor: HANDLE_CURSOR[handle],
    // Vertical swipes scroll (see useGridItem's tile style); the handle arms by
    // holding. touchHold doesn't govern resizing, so this stays pan-y even when tiles go
    // back to `none` for `touchHold: 0`.
    "touch-action": "pan-y",
    "z-index": 4,
  };
  if (handle.includes("n")) style.top = `${-SIDE / 2}px`;
  if (handle.includes("s")) style.bottom = `${-SIDE / 2}px`;
  if (handle.includes("e")) style.right = `${-SIDE / 2}px`;
  if (handle.includes("w")) style.left = `${-SIDE / 2}px`;
  if (handle === "n" || handle === "s") style.left = `calc(50% - ${SIDE / 2}px)`;
  if (handle === "e" || handle === "w") style.top = `calc(50% - ${SIDE / 2}px)`;
  return style;
}
