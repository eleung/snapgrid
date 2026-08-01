import { DragDropProvider } from "@dnd-kit/vue";
import { defineComponent, h } from "vue";
import { markInProvider, useIsInProvider } from "../context.js";

/**
 * Share one dnd-kit `<DragDropProvider>` across several sibling grids so tiles can be
 * dragged between them. (Nested `<GridLayout>`s already share a provider; this is for
 * siblings.) A thin wrapper — the cross-grid seam is the shared manager + collision
 * target. Honors a consumer's own enclosing provider.
 */
export const SnapGridGroup = defineComponent({
  name: "SnapGridGroup",
  setup(_props, { slots }) {
    const inProvider = useIsInProvider();
    if (!inProvider) markInProvider();

    return () =>
      inProvider
        ? slots.default?.()
        : h(DragDropProvider, null, { default: () => slots.default?.() });
  },
});
