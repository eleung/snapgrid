// Shared reflow timing for tiles and the placeholder, so they animate in lockstep
// when a drag reflows the grid. Used by useGridItem (the tile's WAAPI reflow and
// its out-of-drag CSS transition) and GridPlaceholder (its default look).
export const REFLOW_MS = 150;
export const REFLOW_EASING = "ease";
export const REFLOW_TRANSITION = `transform ${REFLOW_MS}ms ${REFLOW_EASING}, width ${REFLOW_MS}ms ${REFLOW_EASING}, height ${REFLOW_MS}ms ${REFLOW_EASING}`;
