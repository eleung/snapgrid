import type { GridConfig, PositionParams } from "./rgl.js";

/**
 * Build the {@link PositionParams} that all of react-grid-layout/core's
 * geometry helpers (`calcGridItemPosition`, `calcXY`, …) expect, from a
 * {@link GridConfig} plus the measured container width.
 *
 * `containerPadding` defaults to `margin` when not set, matching RGL.
 */
export function toPositionParams(grid: GridConfig, containerWidth: number): PositionParams {
  return {
    margin: grid.margin,
    containerPadding: grid.containerPadding ?? grid.margin,
    containerWidth,
    cols: grid.cols,
    rowHeight: grid.rowHeight,
    maxRows: grid.maxRows,
  };
}
