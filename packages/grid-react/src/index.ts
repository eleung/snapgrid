/**
 * @snapgridjs/react
 *
 * A react-grid-layout v2 alternative built on dnd-kit.
 *
 * Two layers:
 *  - Headless: `SnapGridProvider` + `useGridContainer` / `useGridItem` /
 *    `useGridPlaceholder`. You render your own markup; we supply refs,
 *    positioning styles, and drag state. No imposed DOM or CSS.
 *  - Components: `GridLayout` / `GridItem` / `GridPlaceholder` — a thin,
 *    drop-in shell over the hooks for the common case.
 */

// Headless layer
export {
  SnapGridProvider,
  type SnapGridProviderProps,
} from "./SnapGridProvider.js";
// Wrap multiple grids in a group to drag tiles between them (shared provider).
export { SnapGridGroup, type SnapGridGroupProps } from "./SnapGridGroup.js";
export { useGridContainer } from "./hooks/useGridContainer.js";
export type {
  GridContainerProps,
  UseGridContainerResult,
} from "./hooks/useGridContainer.js";
export { useGridItem } from "./hooks/useGridItem.js";
export type { UseGridItemResult } from "./hooks/useGridItem.js";
export { useGridPlaceholder } from "./hooks/useGridPlaceholder.js";
export type { GridPlaceholderInfo } from "./hooks/useGridPlaceholder.js";
export { useGridResizeHandle } from "./hooks/useGridResizeHandle.js";
export type { UseGridResizeHandleResult } from "./hooks/useGridResizeHandle.js";

export {
  DEFAULT_BREAKPOINTS,
  DEFAULT_BREAKPOINT_COLS,
  useResponsiveLayout,
  type UseResponsiveLayoutOptions,
  type UseResponsiveLayoutResult,
} from "./hooks/useResponsiveLayout.js";

// Component layer
export { GridLayout, type GridLayoutProps } from "./GridLayout.js";
export {
  ResponsiveGridLayout,
  type ResponsiveGridLayoutProps,
} from "./ResponsiveGridLayout.js";
export { GridItem, type GridItemProps } from "./GridItem.js";
export {
  GridPlaceholder,
  type GridPlaceholderProps,
} from "./GridPlaceholder.js";
// The floating drag preview is dnd-kit's <DragOverlay> (GridLayout renders one;
// headless consumers render their own). Re-exported so they need not add a
// direct @dnd-kit/react import.
export { DragOverlay } from "@dnd-kit/react";

// Utilities
export {
  useContainerWidth,
  type UseContainerWidthOptions,
  type UseContainerWidthResult,
} from "./hooks/useContainerWidth.js";
export type {
  DragConfig,
  DragSourceInfo,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "./types.js";

// Re-export the layout-engine surface so consumers can build compactors,
// inspect types, and use geometry helpers without a separate import.
export type {
  BreakpointCols,
  Breakpoints,
  Compactor,
  CompactType,
  GridConfig,
  Layout,
  LayoutItem,
  PositionParams,
  ResizeHandleAxis,
  ResponsiveLayouts,
} from "@snapgridjs/core";
export {
  getCompactor,
  horizontalCompactor,
  noCompactor,
  verticalCompactor,
} from "@snapgridjs/core";

// Re-export the dnd-kit primitives needed to build your own draggables for a
// grid (e.g. an external-drop palette). Import these from `@snapgridjs/react`
// rather than directly from `@dnd-kit/*` so they share snapgrid's single dnd-kit
// instance — a second copy of `@dnd-kit/react` is a separate DragDropProvider
// context, and drags from it never reach the grid. `@dnd-kit/{react,dom}` are
// peer dependencies, so your installed copy is the one used here.
export { useDraggable, useDroppable } from "@dnd-kit/react";
export { Feedback, KeyboardSensor, PointerSensor } from "@dnd-kit/dom";
