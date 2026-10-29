import type { ResizeHandleAxis } from "@snapgridjs/core";
import { For, type JSX, createComponent, createMemo, mergeProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useGridContext } from "../context.js";
import { useGridItem } from "../hooks/useGridItem.js";
import { DefaultResizeHandle } from "./DefaultResizeHandle.js";

export interface GridItemProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "id" | "style" | "ref"> {
  /** Matches the layout item's `i`. */
  id: string;
  /** The owning grid's id (from its useGridContainer). */
  group: string;
  /** Merged over the tile's positioning style. */
  style?: JSX.CSSProperties;
}

/**
 * A positioned grid tile: renders its children plus the item's resize handles. `class`,
 * `style` and other `<div>` attributes merge onto the tile element.
 */
export function GridItem(props: GridItemProps): JSX.Element {
  const [local, others] = splitProps(props, ["id", "group", "class", "style", "children"]);
  // `id` and `group` are immutable per instance — tiles are keyed by `i` and a grid's
  // group id is stable — so capturing them once at setup is correct.
  const { id, group } = local;
  const tile = useGridItem({ id, group });
  const { controller, version } = useGridContext(group);

  const handles = createMemo(() => {
    version();
    const config = controller.config;
    return config?.isItemResizable(id) ? config.resizeHandlesFor(id) : [];
  });

  // Built once, outside the `children` getter below: that getter re-runs whenever the
  // consumer's children re-evaluate, and a `<For>` created inside it would remount every
  // handle (and re-register its draggable) each time.
  const handleList = createComponent(For<readonly ResizeHandleAxis[], JSX.Element>, {
    get each() {
      return handles();
    },
    children: (axis) => createComponent(DefaultResizeHandle, { itemId: id, handle: axis, group }),
  });

  return createComponent(
    Dynamic,
    mergeProps(others, {
      component: "div",
      ref: tile.ref,
      "data-grid-id": id,
      get "data-dragging"() {
        return tile.isDragging() || undefined;
      },
      get class() {
        return local.class ? `snapgrid-item ${local.class}` : "snapgrid-item";
      },
      get style() {
        return { ...tile.style(), ...local.style };
      },
      get children() {
        return [local.children, handleList];
      },
    }),
  );
}
