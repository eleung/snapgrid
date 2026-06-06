// Shared reflow timing for tiles and the placeholder, so they animate in lockstep
// when a drag reflows the grid. Used by useGridItem (the tile's WAAPI reflow FLIP
// and its out-of-drag CSS transition) and GridPlaceholder (its default look).
export const REFLOW_MS = 150;
export const REFLOW_EASING = "ease";
// The placeholder is transform-positioned; this transitions its motion.
export const REFLOW_TRANSITION = `transform ${REFLOW_MS}ms ${REFLOW_EASING}, width ${REFLOW_MS}ms ${REFLOW_EASING}, height ${REFLOW_MS}ms ${REFLOW_EASING}`;
// Tiles rest on left/top and animate POSITION via the compositor FLIP in useGridItem,
// so their CSS transition covers SIZE only: a left/top transition would be copied onto
// dnd-kit's float clone and fly it in from (0,0) at lift.
export const TILE_TRANSITION = `width ${REFLOW_MS}ms ${REFLOW_EASING}, height ${REFLOW_MS}ms ${REFLOW_EASING}`;
