import type { ResizeHandleAxis } from "@snapgridjs/core";
import { type JSX, createComponent, mergeProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import { handleStyle } from "../handleStyle.js";
import { useGridResizeHandle } from "../hooks/useGridResizeHandle.js";

export interface DefaultResizeHandleProps {
  itemId: string;
  handle: ResizeHandleAxis;
  group: string;
}

/** The default 14px edge/corner grip rendered by {@link GridItem}. */
export function DefaultResizeHandle(props: DefaultResizeHandleProps): JSX.Element {
  // Identity props, immutable per instance (handles are keyed by axis).
  const resize = useGridResizeHandle({
    id: props.itemId,
    handle: props.handle,
    group: props.group,
  });

  return createComponent(
    Dynamic,
    mergeProps(resize.handleProps, {
      component: "span",
      ref: resize.ref,
      class: `snapgrid-resize-handle snapgrid-resize-handle--${props.handle}`,
      style: handleStyle(props.handle),
    }),
  );
}
