/**
 * @snapgridjs/svelte
 *
 * A react-grid-layout v2 alternative built on dnd-kit, for Svelte 5.
 *
 * Two layers:
 *  - Headless: `createGridContainer` + `createGridItem` / `createGridPlaceholder`,
 *    composed under a dnd-kit `DragDropProvider` you supply. You render your own
 *    markup; the factories return attachments, positioning styles, and drag state.
 *  - Components: `GridLayout` / `GridItem` / `GridPlaceholder` — a thin, drop-in
 *    shell over the factories for the common case.
 *
 * The layout math, compaction, and drag session live in `@snapgridjs/core` +
 * `@snapgridjs/dnd` (framework-free) — this package is the Svelte binding, mirroring
 * `@snapgridjs/react`.
 */

// Headless layer. `createGridContainer` is the grid host (creates the controller +
// drag engine); tiles resolve it by `group` (= the grid's id).
export { createGridContainer } from "./hooks/createGridContainer.svelte.js";
export type { GridContainerResult } from "./hooks/createGridContainer.svelte.js";
export type { UseGridControllerOptions } from "./hooks/createGridController.svelte.js";
export { createGridController } from "./hooks/createGridController.svelte.js";
export { createGridItem } from "./hooks/createGridItem.svelte.js";
export type { GridItemHandle, UseGridItemOptions } from "./hooks/createGridItem.svelte.js";
export { createGridPlaceholder } from "./hooks/createGridPlaceholder.svelte.js";
export type {
  GridPlaceholderHandle,
  GridPlaceholderInfo,
} from "./hooks/createGridPlaceholder.svelte.js";
export { createGridResizeHandle } from "./hooks/createGridResizeHandle.svelte.js";
export type {
  GridResizeHandle,
  UseGridResizeHandleOptions,
} from "./hooks/createGridResizeHandle.svelte.js";
export { resolveController } from "./hooks/resolveController.js";

export {
  DEFAULT_BREAKPOINTS,
  DEFAULT_BREAKPOINT_COLS,
  createResponsiveLayout,
} from "./hooks/createResponsiveLayout.svelte.js";
export type {
  ResponsiveLayoutHandle,
  UseResponsiveLayoutOptions,
} from "./hooks/createResponsiveLayout.svelte.js";

// Component layer
export { default as GridLayout } from "./components/GridLayout.svelte";
export { default as GridItem } from "./components/GridItem.svelte";
export { default as GridPlaceholder } from "./components/GridPlaceholder.svelte";
export { default as ResponsiveGridLayout } from "./components/ResponsiveGridLayout.svelte";
export { default as SnapGridGroup } from "./components/SnapGridGroup.svelte";
export type { GridLayoutProps, ResponsiveGridLayoutProps } from "./props.js";

// Tiles float themselves (dnd-kit's default feedback) — snapgrid doesn't use a drag
// overlay. The raw dnd-kit `<DragOverlay>` is re-exported for consumers who want one.
export { DragOverlay } from "@dnd-kit/svelte";

// Utilities
export { createContainerWidth } from "./hooks/createContainerWidth.svelte.js";
export type {
  ContainerWidthHandle,
  UseContainerWidthOptions,
} from "./hooks/createContainerWidth.svelte.js";

// Drag/drop config + event types are re-exported from the engine package, which owns
// them (kept on the public API so `@snapgridjs/svelte` stays self-sufficient).
export type {
  DragConfig,
  DragSourceInfo,
  DropConfig,
  GridDropData,
  GridEventCallback,
  ResizeConfig,
} from "@snapgridjs/dnd";
// `snapMove` — interop reducer: drag a sortable card INTO a grid (lands at a real
// cell, with compaction). Its drag-OUT counterpart is `removeItemWithCompactor`.
export { snapMove } from "@snapgridjs/dnd";
export type { SnapMoveContext, SnapMoveEvent } from "@snapgridjs/dnd";

// Re-export the layout-engine surface so consumers can build compactors, inspect
// types, and use geometry helpers without a separate import.
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

// Re-export the dnd-kit primitives needed to build your own draggables for a grid
// (e.g. an external-drop palette) or supply your own provider. Import these from
// `@snapgridjs/svelte` rather than directly from `@dnd-kit/*` so they share
// snapgrid's single dnd-kit instance — a second copy of `@dnd-kit/svelte` is a
// separate DragDropProvider context, and drags from it never reach the grid.
export { DragDropProvider, createDraggable, createDroppable } from "@dnd-kit/svelte";
export { Feedback, KeyboardSensor, PointerSensor } from "@dnd-kit/dom";
// Nest a non-grid drop zone inside a grid: pass `nestedDropCollisionDetector` to your
// `createDroppable` and mark the element with `SNAPGRID_DROPPABLE_ATTR`, so the zone
// outranks the grid it sits in (innermost-wins). See the nesting guide.
export { SNAPGRID_DROPPABLE_ATTR, nestedDropCollisionDetector } from "@snapgridjs/dnd";
