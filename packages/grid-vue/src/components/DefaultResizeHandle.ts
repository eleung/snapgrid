import type { ResizeHandleAxis } from "@snapgridjs/core";
import { type PropType, defineComponent, h } from "vue";
import { handleStyle } from "../handleStyle.js";
import { useGridResizeHandle } from "../hooks/useGridResizeHandle.js";

/** The default 14px edge/corner grip rendered by {@link GridItem}. */
export const DefaultResizeHandle = defineComponent({
  name: "SnapGridDefaultResizeHandle",
  props: {
    itemId: { type: String, required: true },
    handle: { type: String as PropType<ResizeHandleAxis>, required: true },
    group: { type: String, required: true },
  },
  setup(props) {
    // Identity props, immutable per instance (handles are keyed by axis).
    const resize = useGridResizeHandle({
      id: props.itemId,
      handle: props.handle,
      group: props.group,
    });

    return () =>
      h("span", {
        ref: resize.setRef,
        ...resize.handleProps,
        class: `snapgrid-resize-handle snapgrid-resize-handle--${props.handle}`,
        style: handleStyle(props.handle),
      });
  },
});
