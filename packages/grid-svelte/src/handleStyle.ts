import type { ResizeHandleAxis } from "@snapgridjs/core";

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

/** Inline-style string positioning a default resize handle on its edge/corner. */
export function handleStyle(handle: ResizeHandleAxis): string {
  const parts = [
    "position: absolute",
    `width: ${SIDE}px`,
    `height: ${SIDE}px`,
    `cursor: ${HANDLE_CURSOR[handle]}`,
    "touch-action: none",
    "z-index: 4",
  ];
  if (handle.includes("n")) parts.push(`top: ${-SIDE / 2}px`);
  if (handle.includes("s")) parts.push(`bottom: ${-SIDE / 2}px`);
  if (handle.includes("e")) parts.push(`right: ${-SIDE / 2}px`);
  if (handle.includes("w")) parts.push(`left: ${-SIDE / 2}px`);
  if (handle === "n" || handle === "s") parts.push(`left: calc(50% - ${SIDE / 2}px)`);
  if (handle === "e" || handle === "w") parts.push(`top: calc(50% - ${SIDE / 2}px)`);
  return `${parts.join("; ")};`;
}
