/**
 * The single import seam between snapgrid and `react-grid-layout/core`.
 *
 * Nothing else in the codebase imports from `react-grid-layout` directly. If a
 * future version of RGL breaks us — or we decide to vendor/fork the engine —
 * this is the only file that has to change.
 */

export type {
  Breakpoint,
  BreakpointCols,
  Breakpoints,
  Compactor,
  CompactType,
  ConstraintContext,
  DragConfig,
  DropConfig,
  GridCellConfig,
  GridCellDimensions,
  GridConfig,
  Layout,
  LayoutConstraint,
  LayoutItem,
  OnBreakpointChangeCallback,
  Position,
  PositionParams,
  PositionStrategy,
  ResizeConfig,
  ResizeHandleAxis,
  ResponsiveLayouts,
} from "react-grid-layout/core";

export {
  absoluteStrategy,
  bottom,
  calcGridCellDimensions,
  calcGridColWidth,
  calcGridItemPosition,
  calcWH,
  calcXY,
  calcXYRaw,
  clamp,
  cloneLayout,
  cloneLayoutItem,
  collides,
  correctBounds,
  createScaledStrategy,
  defaultDragConfig,
  defaultDropConfig,
  defaultGridConfig,
  defaultResizeConfig,
  findOrGenerateResponsiveLayout,
  getAllCollisions,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  getCompactor,
  getFirstCollision,
  getIndentationValue,
  getLayoutItem,
  getStatics,
  horizontalCompactor,
  moveElement,
  noCompactor,
  resolveCompactionCollision,
  sortLayoutItemsByRowCol,
  transformStrategy,
  validateLayout,
  verticalCompactor,
} from "react-grid-layout/core";
