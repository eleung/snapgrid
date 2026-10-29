import { DragDropProvider } from "@dnd-kit/solid";
import { type JSX, type ParentProps, createComponent } from "solid-js";
import { InProviderContext, useIsInProvider } from "../context.js";

/**
 * Share one dnd-kit `<DragDropProvider>` across several sibling grids so tiles can be
 * dragged between them. (Nested `<GridLayout>`s already share a provider; this is for
 * siblings.) A thin wrapper — the cross-grid seam is the shared manager + collision
 * target. Honors a consumer's own enclosing provider.
 */
export function SnapGridGroup(props: ParentProps): JSX.Element {
  if (useIsInProvider()) return props.children;
  return createComponent(InProviderContext.Provider, {
    value: true,
    get children() {
      return createComponent(DragDropProvider, {
        get children() {
          return props.children;
        },
      });
    },
  });
}
