import type { LayoutItem } from "@snapgridjs/core";
import {
  For,
  type JSX,
  createComponent,
  createMemo,
  mergeProps,
  splitProps,
  untrack,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { useGridContainer } from "../hooks/useGridContainer.js";
import type { UseGridControllerOptions } from "../hooks/useGridController.js";
import { CONTROLLER_KEYS, type GridLayoutProps } from "../props.js";
import { GridItem } from "./GridItem.js";
import { GridPlaceholder } from "./GridPlaceholder.js";

/**
 * The grid surface. Exists as its own component so `useGridContainer` runs *inside* the
 * `<DragDropProvider>` that {@link GridLayout} may render — Solid resolves context from
 * the owner chain, so a component cannot see a provider it renders itself.
 */
export function GridSurface(props: GridLayoutProps): JSX.Element {
  const [opts, local, others] = splitProps(props, CONTROLLER_KEYS, ["class", "style", "children"]);
  // `opts` is a reactive props proxy: handing it over as a getter lets the controller
  // track whichever fields the consumer actually changes (width, layout, config).
  const container = useGridContainer(() => opts as UseGridControllerOptions);

  // Tiles are keyed by `i`: `<For>` keys by identity, and layout entries are replaced on
  // every commit, so iterating the entries themselves would remount every tile per drop.
  // Strings compare by value, so iterating ids keeps each tile mounted across commits.
  const ids = createMemo(() => opts.layout.map((it) => it.i));
  const byId = createMemo(() => new Map(opts.layout.map((it) => [it.i, it])));

  // The tiles + placeholder, rebuilt only when the grid's id changes. Tiles bind their
  // `group` once at setup (their sortable registers under it), so an id change must remount
  // them onto the new group — deliberately, here, and never as a side effect of something
  // else the surface happens to read. Everything inside is created untracked.
  const body = createMemo(() => {
    const group = container.group();
    return untrack(() => [
      createComponent(For<string[], JSX.Element>, {
        get each() {
          return ids();
        },
        children: (itemId: string) => {
          // Hold the last entry so a tile being removed never reads `undefined` in the
          // update before `<For>` disposes it.
          const item = createMemo<LayoutItem>(
            (prev) => byId().get(itemId) ?? prev,
            byId().get(itemId)!,
          );
          return createComponent(GridItem, {
            id: itemId,
            group,
            // Untracked: the tile's insert effect would otherwise subscribe to whatever
            // the renderer reads eagerly (e.g. `item().static ? … : …`), and rebuild the
            // tile's content — losing its DOM and state — whenever that changes, which for
            // `item()` is every commit. The renderer is called once per tile, like `<For>`.
            get children() {
              return untrack(() => local.children?.(item));
            },
          });
        },
      }),
      createComponent(GridPlaceholder, { group }),
    ]);
  });

  return createComponent(
    Dynamic,
    mergeProps(others, {
      component: "div",
      ref: container.ref,
      get class() {
        return local.class ? `snapgrid ${local.class}` : "snapgrid";
      },
      get style() {
        return { ...container.style(), ...local.style };
      },
      get "data-drop-target"() {
        return container.isDropTarget() || undefined;
      },
      get children() {
        return body();
      },
    }),
  );
}
