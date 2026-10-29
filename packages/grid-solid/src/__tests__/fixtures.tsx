import { useDragDropManager } from "@dnd-kit/solid";
import type { GridConfig, Layout, ResponsiveLayouts } from "@snapgridjs/core";
import type { DragConfig } from "@snapgridjs/dnd";
import { For } from "solid-js";
import {
  DragDropProvider,
  GridLayout,
  ResponsiveGridLayout,
  SnapGridGroup,
  type UseGridControllerOptions,
  useGridContainer,
  useGridItem,
} from "../index.js";

// Solid test fixtures, written in JSX the way consumers write it (the package itself is
// JSX-free). Props are read through `props.x` so callers can drive them with signals.

const SMALL_GRID: Partial<GridConfig> = {
  cols: 4,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [0, 0],
};

/** A turnkey <GridLayout> rendering one div per item. */
export function Grid(props: {
  layout: Layout;
  width?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
}) {
  return (
    <GridLayout
      layout={props.layout}
      width={props.width ?? 400}
      gridConfig={SMALL_GRID}
      isResizable={props.isResizable ?? true}
      isDraggable={props.isDraggable ?? true}
    >
      {(item) => <div class="content">{item().i}</div>}
    </GridLayout>
  );
}

/** A headless tile built from `useGridItem`. */
function Tile(props: { id: string; group: string }) {
  const tile = useGridItem({ id: props.id, group: props.group });
  return (
    <div
      ref={tile.ref}
      class="headless-tile"
      data-grid-id={props.id}
      // Re-states the style: jsdom drops `touch-action` (which its CSSStyleDeclaration
      // does not implement) when it is set on the element.
      data-touch-action={tile.style()["touch-action"]}
      style={tile.style()}
    >
      {props.id}
    </div>
  );
}

/** A headless surface built from `useGridContainer`. Must live under the provider. */
function HeadlessContainer(props: { layout: Layout; width: number; dragConfig?: DragConfig }) {
  const container = useGridContainer(() => ({
    layout: props.layout,
    width: props.width,
    dragConfig: props.dragConfig,
    gridConfig: SMALL_GRID,
  }));
  return (
    <div
      ref={container.ref}
      class="headless-surface"
      data-group={container.group()}
      style={container.style()}
    >
      <For each={props.layout.map((it) => it.i)}>
        {(id) => <Tile id={id} group={container.group()} />}
      </For>
    </div>
  );
}

export function Headless(props: { layout: Layout; width?: number; dragConfig?: DragConfig }) {
  return (
    <DragDropProvider>
      <HeadlessContainer
        layout={props.layout}
        width={props.width ?? 400}
        dragConfig={props.dragConfig}
      />
    </DragDropProvider>
  );
}

/**
 * A nested grid hosted inside an outer tile: the inner grid must NOT mint a second
 * dnd-kit manager (it shares the outer provider). If dedupe were broken, the inner tiles
 * would throw "no grid found".
 */
export function Nested(props: { outer: Layout; inner: Layout }) {
  return (
    <GridLayout id="outer" layout={props.outer} width={400} gridConfig={SMALL_GRID}>
      {(item) =>
        item().i === "host" ? (
          <GridLayout id="inner" layout={props.inner} width={180} gridConfig={SMALL_GRID}>
            {(inner) => <div class="inner-content">{inner().i}</div>}
          </GridLayout>
        ) : (
          <div class="outer-content">{item().i}</div>
        )
      }
    </GridLayout>
  );
}

/** Two sibling grids sharing one provider so tiles can cross between them. */
export function Siblings(props: { left: Layout; right: Layout }) {
  return (
    <SnapGridGroup>
      <GridLayout id="left" layout={props.left} width={400} gridConfig={SMALL_GRID}>
        {(item) => <div class="left-content">{item().i}</div>}
      </GridLayout>
      <GridLayout id="right" layout={props.right} width={400} gridConfig={SMALL_GRID}>
        {(item) => <div class="right-content">{item().i}</div>}
      </GridLayout>
    </SnapGridGroup>
  );
}

export function Responsive(props: {
  width: number;
  layouts: ResponsiveLayouts;
  onBreakpointChange?: (breakpoint: string, cols: number) => void;
}) {
  return (
    <ResponsiveGridLayout
      width={props.width}
      layouts={props.layouts}
      onBreakpointChange={props.onBreakpointChange}
      rowHeight={100}
      margin={[10, 10]}
    >
      {(item) => <div class="content">{item().i}</div>}
    </ResponsiveGridLayout>
  );
}

const WIDE_GRID: Partial<GridConfig> = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [10, 10],
};

export interface Board {
  id: string;
  layout: Layout;
  options?: Partial<UseGridControllerOptions>;
}

/**
 * A bare grid surface that exposes the shared manager, so a test can dispatch synthetic
 * operations through its monitor (the same channel the engine binds to).
 */
function DragBoard(props: Board & { onManager?: (manager: unknown) => void }) {
  props.onManager?.(useDragDropManager());
  const container = useGridContainer(() => ({
    id: props.id,
    layout: props.layout,
    width: 1210,
    gridConfig: WIDE_GRID,
    ...props.options,
  }));
  return <div ref={container.ref} style={container.style()} />;
}

export function DragProvider(props: Board & { onManager?: (manager: unknown) => void }) {
  return (
    <DragDropProvider>
      <DragBoard
        id={props.id}
        layout={props.layout}
        options={props.options}
        onManager={props.onManager}
      />
    </DragDropProvider>
  );
}

/** Two grids sharing one manager (the cross-grid seam). */
export function CrossGrid(props: { a: Board; b: Board; onManager?: (manager: unknown) => void }) {
  return (
    <DragDropProvider>
      <DragBoard {...props.a} onManager={props.onManager} />
      <DragBoard {...props.b} />
    </DragDropProvider>
  );
}
