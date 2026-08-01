import { computed, defineComponent, h } from "vue";
import { useGridContext } from "../context.js";
import { useGridItem } from "../hooks/useGridItem.js";
import { DefaultResizeHandle } from "./DefaultResizeHandle.js";

/**
 * A positioned grid tile: renders the default-slot content plus the item's resize
 * handles. `class` and `style` fall through and merge onto the tile element.
 */
export const GridItem = defineComponent({
  name: "SnapGridItem",
  inheritAttrs: false,
  props: {
    /** Matches the layout item's `i`. */
    id: { type: String, required: true },
    /** The owning grid's id (from its useGridContainer). */
    group: { type: String, required: true },
  },
  setup(props, { slots, attrs }) {
    // `id` and `group` are immutable per instance — tiles are keyed by `i` and a grid's
    // group id is stable — so capturing them once at setup is correct.
    const tile = useGridItem({ id: props.id, group: props.group });
    const { controller, version } = useGridContext(props.group);

    const handles = computed(() => {
      version();
      const config = controller.config;
      return config?.isItemResizable(props.id) ? config.resizeHandlesFor(props.id) : [];
    });

    return () =>
      h(
        "div",
        {
          ...attrs,
          ref: tile.setRef,
          "data-grid-id": props.id,
          "data-dragging": tile.isDragging.value || undefined,
          class: ["snapgrid-item", attrs.class],
          style: [tile.style.value, attrs.style],
        },
        [
          slots.default?.(),
          ...handles.value.map((axis) =>
            h(DefaultResizeHandle, {
              key: axis,
              itemId: props.id,
              handle: axis,
              group: props.group,
            }),
          ),
        ],
      );
  },
});
