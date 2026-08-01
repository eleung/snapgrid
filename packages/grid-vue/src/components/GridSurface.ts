import { defineComponent, h } from "vue";
import { useGridContainer } from "../hooks/useGridContainer.js";
import type { UseGridControllerOptions } from "../hooks/useGridController.js";
import { gridControllerProps } from "../props.js";
import { GridItem } from "./GridItem.js";
import { GridPlaceholder } from "./GridPlaceholder.js";

/**
 * The grid surface. Exists as its own component so `useGridContainer` runs *inside* the
 * `<DragDropProvider>` that {@link GridLayout} may render — Vue resolves `inject` from
 * the parent chain, so a component cannot see a provider it renders itself.
 */
export const GridSurface = defineComponent({
  name: "SnapGridSurface",
  inheritAttrs: false,
  props: gridControllerProps,
  setup(props, { slots, attrs }) {
    // `props` is reactive: handing it over as a getter lets the controller track
    // whichever fields the consumer actually changes (width, layout, config).
    const container = useGridContainer(() => props as unknown as UseGridControllerOptions);

    return () =>
      h(
        "div",
        {
          ...attrs,
          ref: container.setRef,
          class: ["snapgrid", attrs.class],
          style: [container.style.value, attrs.style],
          "data-drop-target": container.isDropTarget.value || undefined,
        },
        [
          ...props.layout.map((layoutItem) =>
            h(
              GridItem,
              { key: layoutItem.i, id: layoutItem.i, group: container.group.value },
              { default: () => slots.item?.({ item: layoutItem }) },
            ),
          ),
          h(GridPlaceholder, { group: container.group.value }),
        ],
      );
  },
});
