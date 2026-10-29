/**
 * @snapgridjs/solid
 *
 * A react-grid-layout v2 alternative built on dnd-kit, for SolidJS.
 *
 * Two layers:
 *  - Headless: `useGridContainer` + `useGridItem` / `useGridPlaceholder`, composed
 *    under a dnd-kit `DragDropProvider` you supply. You render your own markup; the
 *    hooks return ref callbacks, positioning-style accessors, and drag state.
 *  - Components: `GridLayout` / `GridItem` / `GridPlaceholder` — a thin, drop-in shell
 *    over the hooks for the common case.
 *
 * The layout math, compaction, and drag session live in `@snapgridjs/core` +
 * `@snapgridjs/dnd` (framework-free) — this package is the Solid binding, mirroring
 * `@snapgridjs/react`, `@snapgridjs/svelte` and `@snapgridjs/vue`.
 *
 * NB: Solid resolves context from the owner chain, so every hook here must be called in a
 * component rendered INSIDE the `<DragDropProvider>`, never in the component that renders
 * it.
 */

// Headless layer. `useGridContainer` is the grid host (creates the controller + drag
// engine); tiles resolve it by `group` (= the grid's id).
export { useGridContainer } from "./hooks/useGridContainer.js";
export type { GridContainerResult } from "./hooks/useGridContainer.js";
export { useGridController } from "./hooks/useGridController.js";
export type { UseGridControllerOptions } from "./hooks/useGridController.js";
export { useGridItem } from "./hooks/useGridItem.js";
export type { GridItemHandle, UseGridItemOptions } from "./hooks/useGridItem.js";
export { useGridPlaceholder } from "./hooks/useGridPlaceholder.js";
export type { GridPlaceholderInfo } from "./hooks/useGridPlaceholder.js";
export { useGridResizeHandle } from "./hooks/useGridResizeHandle.js";
export type { GridResizeHandle, UseGridResizeHandleOptions } from "./hooks/useGridResizeHandle.js";
export { resolveController } from "./hooks/resolveController.js";

export {
  DEFAULT_BREAKPOINTS,
  DEFAULT_BREAKPOINT_COLS,
  useResponsiveLayout,
} from "./hooks/useResponsiveLayout.js";
export type {
  ResponsiveLayoutHandle,
  UseResponsiveLayoutOptions,
} from "./hooks/useResponsiveLayout.js";

// Component layer
export { GridLayout } from "./components/GridLayout.js";
export { GridItem } from "./components/GridItem.js";
export type { GridItemProps } from "./components/GridItem.js";
export { GridPlaceholder } from "./components/GridPlaceholder.js";
export type { GridPlaceholderProps } from "./components/GridPlaceholder.js";
export { ResponsiveGridLayout } from "./components/ResponsiveGridLayout.js";
export { SnapGridGroup } from "./components/SnapGridGroup.js";
export type { GridItemRenderer, GridLayoutProps, ResponsiveGridLayoutProps } from "./props.js";

// Tiles float themselves (dnd-kit's default feedback) — snapgrid doesn't use a drag
// overlay. The raw dnd-kit `<DragOverlay>` is re-exported for consumers who want one.
export { DragOverlay } from "@dnd-kit/solid";

// Utilities
export { useContainerWidth } from "./hooks/useContainerWidth.js";
export type { ContainerWidthHandle, UseContainerWidthOptions } from "./hooks/useContainerWidth.js";

// Drag/drop config + event types are re-exported from the engine package, which owns
// them (kept on the public API so `@snapgridjs/solid` stays self-sufficient).
export type {
  DragConfig,
  DragSourceInfo,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "@snapgridjs/dnd";
// `snapMove` — interop reducer: drag a sortable card INTO a grid (lands at a real cell,
// with compaction). Its drag-OUT counterpart is `removeItemWithCompactor`.
export { snapMove } from "@snapgridjs/dnd";
export type { SnapMoveContext, SnapMoveEvent } from "@snapgridjs/dnd";

// Re-export the layout-engine surface so consumers can build compactors, inspect types,
// and use geometry helpers without a separate import.
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

// Re-export the dnd-kit primitives needed to build your own draggables for a grid (e.g.
// an external-drop palette) or supply your own provider. Import these from
// `@snapgridjs/solid` rather than directly from `@dnd-kit/*` so they share snapgrid's
// single dnd-kit instance — a second copy of `@dnd-kit/solid` is a separate
// DragDropProvider context, and drags from it never reach the grid.
export { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/solid";
export { Feedback, KeyboardSensor, PointerSensor } from "@dnd-kit/dom";
// Nest a non-grid drop zone inside a grid: pass `nestedDropCollisionDetector` to your
// `useDroppable` and mark the element with `SNAPGRID_DROPPABLE_ATTR`, so the zone
// outranks the grid it sits in (innermost-wins). See the nesting guide.
export { SNAPGRID_DROPPABLE_ATTR, nestedDropCollisionDetector } from "@snapgridjs/dnd";
