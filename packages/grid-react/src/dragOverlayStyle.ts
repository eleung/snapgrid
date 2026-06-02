import type { CSSProperties } from "react";

/**
 * Base style for dnd-kit's `<DragOverlay>` element.
 *
 * dnd-kit's overlay is a plain `<div data-dnd-overlay>` with no positioning of
 * its own — it relies on a stylesheet dnd-kit injects at runtime
 * (`[data-dnd-dragging] { position: fixed !important }` plus a `display: none`
 * rule when idle), driven by an attribute the Feedback plugin toggles
 * imperatively. Because that attribute toggle (dnd-kit DOM) and the overlay's
 * content mount/unmount (React) are committed by two different systems, there is
 * a transient frame around drop where the div holds the dragged content but is
 * neither `position: fixed` nor `display: none`. Rendered inside the grid (as
 * `<GridLayout>` does) it then lays out as a normal-flow block — the dragged
 * tile flashing full-width at the bottom of the grid for a frame.
 *
 * Pinning it out of flow here pre-empts that flash; dnd-kit's own `!important`
 * rules still drive the live position during a real drag, so this is purely a
 * fallback for the in-between frame.
 *
 * `<GridLayout>` applies this to the overlay it renders. In the headless layer,
 * spread it onto your own `<DragOverlay style={dragOverlayStyle}>`.
 */
export const dragOverlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  pointerEvents: "none",
};
