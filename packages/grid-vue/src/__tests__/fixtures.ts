import { DragDropProvider, useDragDropManager } from "@dnd-kit/vue";
import type { GridConfig, Layout, LayoutItem, ResponsiveLayouts } from "@snapgridjs/core";
import { type PropType, defineComponent, h } from "vue";
import {
  GridLayout,
  ResponsiveGridLayout,
  SnapGridGroup,
  type UseGridControllerOptions,
  useGridContainer,
  useGridItem,
} from "../index.js";

// Vue test fixtures, authored as `defineComponent` render functions to match how the
// package itself is written (no SFC toolchain in this package).

const SMALL_GRID: Partial<GridConfig> = {
  cols: 4,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [0, 0],
};

const layoutProp = { type: Array as PropType<Layout>, required: true as const };

/** A turnkey <GridLayout> rendering one div per item. */
export const Grid = defineComponent({
  props: {
    layout: layoutProp,
    width: { type: Number, default: 400 },
    gridConfig: { type: Object as PropType<Partial<GridConfig>>, default: () => SMALL_GRID },
    isResizable: { type: Boolean, default: true },
    isDraggable: { type: Boolean, default: true },
  },
  setup(props) {
    return () =>
      h(
        GridLayout,
        {
          layout: props.layout,
          width: props.width,
          gridConfig: props.gridConfig,
          isResizable: props.isResizable,
          isDraggable: props.isDraggable,
        },
        { item: ({ item }: { item: LayoutItem }) => h("div", { class: "content" }, item.i) },
      );
  },
});

/** A headless tile built from `useGridItem`. */
const Tile = defineComponent({
  props: { id: { type: String, required: true }, group: { type: String, required: true } },
  setup(props) {
    const tile = useGridItem({ id: props.id, group: props.group });
    return () =>
      h(
        "div",
        {
          class: "headless-tile",
          "data-grid-id": props.id,
          ref: tile.setRef,
          style: tile.style.value,
        },
        props.id,
      );
  },
});

/** A headless surface built from `useGridContainer`. Must live under the provider. */
const HeadlessContainer = defineComponent({
  props: { layout: layoutProp, width: { type: Number, required: true } },
  setup(props) {
    const container = useGridContainer(() => ({
      layout: props.layout,
      width: props.width,
      gridConfig: SMALL_GRID,
    }));
    return () =>
      h(
        "div",
        {
          class: "headless-surface",
          "data-group": container.group.value,
          ref: container.setRef,
          style: container.style.value,
        },
        props.layout.map((it) => h(Tile, { key: it.i, id: it.i, group: container.group.value })),
      );
  },
});

export const Headless = defineComponent({
  props: { layout: layoutProp, width: { type: Number, default: 400 } },
  setup(props) {
    return () =>
      h(DragDropProvider, null, {
        default: () => h(HeadlessContainer, { layout: props.layout, width: props.width }),
      });
  },
});

/**
 * A nested grid hosted inside an outer tile: the inner grid must NOT mint a second
 * dnd-kit manager (it shares the outer provider). If dedupe were broken, the inner tiles
 * would throw "no grid found".
 */
export const Nested = defineComponent({
  props: { outer: layoutProp, inner: layoutProp },
  setup(props) {
    return () =>
      h(
        GridLayout,
        { id: "outer", layout: props.outer, width: 400, gridConfig: SMALL_GRID },
        {
          item: ({ item }: { item: LayoutItem }) =>
            item.i === "host"
              ? h(
                  GridLayout,
                  { id: "inner", layout: props.inner, width: 180, gridConfig: SMALL_GRID },
                  {
                    item: ({ item: innerItem }: { item: LayoutItem }) =>
                      h("div", { class: "inner-content" }, innerItem.i),
                  },
                )
              : h("div", { class: "outer-content" }, item.i),
        },
      );
  },
});

/** Two sibling grids sharing one provider so tiles can cross between them. */
export const Siblings = defineComponent({
  props: { left: layoutProp, right: layoutProp },
  setup(props) {
    const slot = (cls: string) => ({
      item: ({ item }: { item: LayoutItem }) => h("div", { class: cls }, item.i),
    });
    return () =>
      h(SnapGridGroup, null, {
        default: () => [
          h(
            GridLayout,
            { id: "left", layout: props.left, width: 400, gridConfig: SMALL_GRID },
            slot("left-content"),
          ),
          h(
            GridLayout,
            { id: "right", layout: props.right, width: 400, gridConfig: SMALL_GRID },
            slot("right-content"),
          ),
        ],
      });
  },
});

export const Responsive = defineComponent({
  props: {
    width: { type: Number, required: true },
    layouts: { type: Object as PropType<ResponsiveLayouts>, required: true },
    onBreakpointChange: Function as PropType<(breakpoint: string, cols: number) => void>,
  },
  setup(props) {
    return () =>
      h(
        ResponsiveGridLayout,
        {
          width: props.width,
          layouts: props.layouts,
          onBreakpointChange: props.onBreakpointChange,
          rowHeight: 100,
          margin: [10, 10],
        },
        { item: ({ item }: { item: LayoutItem }) => h("div", { class: "content" }, item.i) },
      );
  },
});

const WIDE_GRID: Partial<GridConfig> = {
  cols: 12,
  rowHeight: 100,
  margin: [10, 10],
  containerPadding: [10, 10],
};

/**
 * A bare grid surface that exposes the shared manager, so a test can dispatch synthetic
 * operations through its monitor (the same channel the engine binds to).
 */
const DragBoard = defineComponent({
  props: {
    id: { type: String, required: true },
    layout: layoutProp,
    options: Object as PropType<Partial<UseGridControllerOptions>>,
    onManager: Function as PropType<(manager: unknown) => void>,
  },
  setup(props) {
    props.onManager?.(useDragDropManager().value);
    const container = useGridContainer(() => ({
      id: props.id,
      layout: props.layout,
      width: 1210,
      gridConfig: WIDE_GRID,
      ...props.options,
    }));
    return () => h("div", { ref: container.setRef, style: container.style.value });
  },
});

export const DragProvider = defineComponent({
  props: {
    id: { type: String, required: true },
    layout: layoutProp,
    options: Object as PropType<Partial<UseGridControllerOptions>>,
    onManager: Function as PropType<(manager: unknown) => void>,
  },
  setup(props) {
    return () =>
      h(DragDropProvider, null, {
        default: () =>
          h(DragBoard, {
            id: props.id,
            layout: props.layout,
            options: props.options,
            onManager: props.onManager,
          }),
      });
  },
});

export interface Board {
  id: string;
  layout: Layout;
  options?: Partial<UseGridControllerOptions>;
}

/** Two grids sharing one manager (the cross-grid seam). */
export const CrossGrid = defineComponent({
  props: {
    a: { type: Object as PropType<Board>, required: true },
    b: { type: Object as PropType<Board>, required: true },
    onManager: Function as PropType<(manager: unknown) => void>,
  },
  setup(props) {
    return () =>
      h(DragDropProvider, null, {
        default: () => [
          h(DragBoard, {
            id: props.a.id,
            layout: props.a.layout,
            options: props.a.options,
            onManager: props.onManager,
          }),
          h(DragBoard, { id: props.b.id, layout: props.b.layout, options: props.b.options }),
        ],
      });
  },
});
