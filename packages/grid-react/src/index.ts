/**
 * @snapgridjs/react
 *
 * A react-grid-layout v2 alternative built on dnd-kit.
 *
 * Two layers:
 *  - Headless: `useGridContainer` + `useGridItem` / `useGridPlaceholder`,
 *    composed under a dnd-kit `DragDropProvider` you supply. You render your own
 *    markup; we supply refs, positioning styles, and drag state. No imposed DOM or CSS.
 *  - Components: `GridLayout` / `GridItem` / `GridPlaceholder` — a thin,
 *    drop-in shell over the hooks for the common case.
 */

// Headless layer. `useGridContainer` is the grid host (creates the controller +
// drag monitor); items resolve it by `group` (= the grid's id).
export { useGridContainer } from "./hooks/useGridContainer.js";
export type {
  GridContainerProps,
  UseGridContainerResult,
} from "./hooks/useGridContainer.js";
export type { UseGridControllerOptions } from "./hooks/useGridController.js";
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
export { GridLayout, type GridLayoutProps, SnapGridGroup } from "./components/GridLayout.js";
export {
  ResponsiveGridLayout,
  type ResponsiveGridLayoutProps,
} from "./components/ResponsiveGridLayout.js";
export { GridItem, type GridItemProps } from "./components/GridItem.js";
export {
  GridPlaceholder,
  type GridPlaceholderProps,
} from "./components/GridPlaceholder.js";
// Tiles float themselves (dnd-kit's default feedback) — snapgrid doesn't use a
// drag overlay. The raw dnd-kit `<DragOverlay>` is re-exported for consumers who
// want one anyway (e.g. a custom cross-ecosystem preview).
export { DragOverlay } from "@dnd-kit/react";

// Utilities
export {
  useContainerWidth,
  type UseContainerWidthOptions,
  type UseContainerWidthResult,
} from "./hooks/useContainerWidth.js";
// Drag/drop config + event types are re-exported from the engine package, which
// owns them (kept on the public API so `@snapgridjs/react` stays self-sufficient).
export type {
  DragConfig,
  DragSourceInfo,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "@snapgridjs/dnd";
// `snapMove` — interop reducer: drag a sortable card INTO a grid (lands at a real
// cell, with compaction). Its drag-OUT counterpart is `removeItemWithCompactor`
// (re-exported below) — remove AND re-pack, since a plain `filter` leaves a hole.
export { snapMove } from "@snapgridjs/dnd";
export type { SnapMoveContext, SnapMoveEvent } from "@snapgridjs/dnd";

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
  defaultGridConfig,
  getCompactor,
  horizontalCompactor,
  insertItemWithCompactor,
  noCompactor,
  removeItemWithCompactor,
  toPositionParams,
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
