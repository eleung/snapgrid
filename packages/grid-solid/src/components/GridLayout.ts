import { DragDropProvider } from "@dnd-kit/solid";
import { type JSX, createComponent } from "solid-js";
import { InProviderContext, useIsInProvider } from "../context.js";
import type { GridLayoutProps } from "../props.js";
import { GridSurface } from "./GridSurface.js";

/**
 * Drop-in grid: a controlled, react-grid-layout v2-compatible layout backed by dnd-kit.
 * Supplies the dnd-kit `<DragDropProvider>` for the turnkey case, unless a snapgrid one
 * is already above — nested grids and `<SnapGridGroup>` siblings share it, the
 * cross-grid seam. A plain `<DragDropProvider>` of your own isn't detected (a nested one
 * is still minted inside it); to share your own provider, compose the headless layer.
 * The surface itself lives in a child component so it sets up *inside* the provider
 * (else the manager isn't reachable).
 *
 * Item content comes from a render-prop child:
 * `<GridLayout …>{(item) => <div>{item().i}</div>}</GridLayout>`.
 */
export function GridLayout(props: GridLayoutProps): JSX.Element {
  if (useIsInProvider()) return createComponent(GridSurface, props);
  return createComponent(InProviderContext.Provider, {
    value: true,
    get children() {
      return createComponent(DragDropProvider, {
        get children() {
          return createComponent(GridSurface, props);
        },
      });
    },
  });
}
