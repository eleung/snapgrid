/**
 * The DOM element of a dnd-kit entity (a draggable, droppable, or drag source).
 * dnd-kit's abstract types don't expose `element`, but the DOM layer snapgrid
 * runs on always sets it — this centralizes that one assumption (and the cast)
 * in a single place instead of scattering it across the drag code.
 */
export function domElement(entity: object | null | undefined): Element | null {
  return (entity as { element?: Element | null } | null | undefined)?.element ?? null;
}
