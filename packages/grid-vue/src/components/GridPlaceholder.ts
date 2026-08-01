import { defineComponent, h } from "vue";
import { useGridPlaceholder } from "../hooks/useGridPlaceholder.js";
import { REFLOW_TRANSITION } from "../reflow.js";

const DEFAULT_LOOK = `background: rgba(99, 102, 241, 0.2); border: 1px dashed rgba(99, 102, 241, 0.6); border-radius: 4px; box-sizing: border-box; z-index: 2; transition: ${REFLOW_TRANSITION};`;

/**
 * The landing-cell marker shown while a drag is in progress; renders nothing when the
 * grid is idle. `class` and `style` fall through and merge onto the element.
 */
export const GridPlaceholder = defineComponent({
  name: "SnapGridPlaceholder",
  inheritAttrs: false,
  props: {
    /** The owning grid's id (from its useGridContainer). */
    group: { type: String, required: true },
  },
  setup(props, { attrs }) {
    // `group` is the stable grid id for this placeholder's lifetime.
    const placeholder = useGridPlaceholder(props.group);

    return () => {
      const current = placeholder.value;
      if (!current) return null;
      return h("div", {
        ...attrs,
        "aria-hidden": "true",
        class: ["snapgrid-placeholder", attrs.class],
        style: [current.style, DEFAULT_LOOK, attrs.style],
      });
    };
  },
});
